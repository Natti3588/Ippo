package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/database"
	"github.com/Natti3588/Ippo/backend/internal/handler"
	"github.com/Natti3588/Ippo/backend/internal/repository"
	"github.com/Natti3588/Ippo/backend/internal/service"
	_ "github.com/go-sql-driver/mysql"
)

// shutdownTimeout は SIGTERM を受けてから、処理中のリクエストを待つ上限。
// SIGTERM とは UNIX系OSにおいてプロセスに終了を穏やかに要求する非同期通知。
const shutdownTimeout = 20 * time.Second

func main() {
	logger := slog.New(handler.NewLogHandler(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// ローカルの Docker-Compose は DATABASE_URL
	// ECSでは DB_* の5つの環境変数から組み立てる
	rawDSN, err := database.DSNFromEnv()
	if err != nil {
		logger.Error("接続情報が足りません", "error", err)
		os.Exit(1)
	}

	if err := database.Migrate(rawDSN); err != nil {
		logger.Error("マイグレーションに失敗", "error", err)
		os.Exit(1)
	}
	logger.Info("migration applied")

	dsn, err := database.AppDSN(rawDSN)
	if err != nil {
		logger.Error("DSNの解析に失敗", "error", err)
		os.Exit(1)
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		// ドライバの初期化エラーには接続情報が含まれうるため出力しない。
		logger.Error("接続プールの作成に失敗")
		os.Exit(1)
	}
	defer db.Close()
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	pingCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(pingCtx); err != nil {
		logger.Error("データベースに接続できません", "error", err)
		os.Exit(1)
	}
	logger.Info("database connected")

	boardRepo := repository.NewBoardRepository(db)
	authRepo := repository.NewAuthRepository(db)

	boardSvc := service.NewBoardService(boardRepo)
	authSvc := service.NewAuthService(authRepo)

	// Cookie の Secure は既定で有効にする。
	// ローカルの http で試すときだけ COOKIE_INSECURE=true を明示する。
	// 環境変数名を否定形にしているのは、書き忘れたときに壊れるのが
	// 本番ではなく開発側になるようにするためである。
	secureCookie := os.Getenv("COOKIE_INSECURE") != "true"

	boardHandler := handler.NewBoardHandler(boardSvc, logger)
	authHandler := handler.NewAuthHandler(authSvc, logger, secureCookie)
	authMiddleware := handler.NewAuthMiddleware(authSvc, logger)
	h := handler.NewServer(boardHandler, authHandler)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthz", handler.Health)

	// BaseURL でルートの先頭に /api を付ける。
	router := api.HandlerWithOptions(h, api.StdHTTPServerOptions{
		BaseURL:          "/api",
		BaseRouter:       mux,
		Middlewares:      []api.MiddlewareFunc{authMiddleware.Attach},
		ErrorHandlerFunc: handler.ParamErrorHandler(logger),
	})

	// アクセスログは ServeMux の外側に巻く。
	root := handler.AccessLog(logger)(router)
	root = handler.RequestID(root)

	// ボディの上限はアクセスログより内側でよい。
	// 超過したリクエストも 400 として1行記録されるほうが追いやすい。
	root = handler.LimitBody(root)

	// タイムアウトはすべて明示する。http.Server のゼロ値は「無制限」であり、
	// http.ListenAndServe はゼロ値の Server を作る。
	// 書かないことが「無制限を選ぶ」ことになるため、4つとも値を置く。
	//
	// 値を環境変数にしないのは、設定を忘れた環境が無制限に戻るのを防ぐため。
	srv := &http.Server{
		Addr:    ":8080",
		Handler: root,

		// ヘッダは常に一瞬で届くべきなので、ボディとは別に短く締める。
		// 1バイトずつヘッダを送り続ける接続（Slowloris）をここで落とす。
		ReadHeaderTimeout: 5 * time.Second,

		// ボディ込みの読み取り時間。
		ReadTimeout: 15 * time.Second,

		// レスポンスを極端に遅く受け取るクライアントで接続を掴まれないようにする。
		WriteTimeout: 15 * time.Second,

		// keep-alive で居座る接続を切る。
		IdleTimeout: 60 * time.Second,
	}

	// SIGTERM（ECS がタスクを止めるときに送る）と Ctrl+C を受け取る。
	// signal.NotifyContext は、シグナルが来たら ctx をキャンセルする。
	shutdownSignal, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ListenAndServe は待ち受けている間ブロックするので、別の goroutine で動かす。
	serveErr := make(chan error, 1)
	go func() {
		serveErr <- srv.ListenAndServe()
	}()

	logger.Info("server started", "addr", srv.Addr)

	select {
	case err := <-serveErr:
		// 待ち受けそのものに失敗した（ポートが使用中など）。
		logger.Error("server stopped", "error", err)
		os.Exit(1)

	case <-shutdownSignal.Done():
		// stop() でシグナルの捕捉を解除する。
		// これにより、2回目の SIGTERM や Ctrl+C は既定の動作（即終了）に戻る。
		// シャットダウンが長引いたときに、利用者が強制終了できる余地を残す。
		stop()
		logger.Info("shutdown started", "timeout", shutdownTimeout.String())
	}

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancelShutdown()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown timed out", "error", err)
		os.Exit(1)
	}

	logger.Info("shutdown completed")
}
