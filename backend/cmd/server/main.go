package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/database"
	"github.com/Natti3588/Ippo/backend/internal/handler"
	"github.com/Natti3588/Ippo/backend/internal/repository"
	"github.com/Natti3588/Ippo/backend/internal/service"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	logger := slog.New(handler.NewLogHandler(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// DATABASE_URL は互換性のため名前を維持する。値はMySQLのDSN。
	rawDSN := os.Getenv("DATABASE_URL")
	if rawDSN == "" {
		logger.Error("環境変数 DATABASE_URL が設定されていません")
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

	router := api.HandlerWithOptions(h, api.StdHTTPServerOptions{
		Middlewares: []api.MiddlewareFunc{authMiddleware.Attach},
	})

	// アクセスログは ServeMux の外側に巻く。
	// 生成された Middlewares に入れるとルートが見つかったときしか動かず、
	// 404 と 405 が記録されない。
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

		// ボディ込みの読み取り時間。画像アップロードを作らない前提で短くできる。
		// 大きいファイルを受ける要件が出たら、ここだけ伸ばす。
		ReadTimeout: 15 * time.Second,

		// レスポンスを極端に遅く受け取るクライアントで接続を掴まれないようにする。
		WriteTimeout: 15 * time.Second,

		// keep-alive で居座る接続を切る。
		// ゼロにすると ReadTimeout にフォールバックするため、明示しておく。
		IdleTimeout: 60 * time.Second,
	}

	logger.Info("server started", "addr", srv.Addr)
	if err := srv.ListenAndServe(); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
