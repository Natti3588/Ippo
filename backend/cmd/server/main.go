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
//
// 下限は WriteTimeout の15秒。正当なリクエストの最長がそれなので、
// 短くすると自分で正しい処理を切ることになる。
// 上限は ECS の stopTimeout の既定30秒。超えると SIGKILL で強制終了され、
// 「シャットダウン完了」のログが残らない。
const shutdownTimeout = 20 * time.Second

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

	// 契約の外の経路を先に登録してから、生成されたルートを同じ mux に足す。
	// BaseRouter を渡さないと生成側が自分で mux を作ってしまい、
	// ここで登録したものが消える。
	//
	// GET を明示すると、それ以外のメソッドには ServeMux が 405 を返す。
	// 書かないと POST でも DELETE でも 200 が返り、
	// 「生きているか」を答えるだけの経路が、何にでも答える経路になる。
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/healthz", handler.Health)

	// BaseURL でルートの先頭に /api を付ける。
	//
	// ALB はパスを書き換えないので、/api/posts は /api/posts のまま届く。
	// ここで受けられるようにしておかないと、開発では動いて本番だけ 404 になる。
	//
	// /api が必要なのは、/posts がフロントとバックで衝突するからである。
	// /posts/{id} は Next.js の画面、/api/posts/{id} は JSON を返す経路で、
	// この接頭辞が無いと ALB が2つを区別できない。
	router := api.HandlerWithOptions(h, api.StdHTTPServerOptions{
		BaseURL:     "/api",
		BaseRouter:  mux,
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

	// SIGTERM（ECS がタスクを止めるときに送る）と Ctrl+C を受け取る。
	// signal.NotifyContext は、シグナルが来たら ctx をキャンセルする。
	shutdownSignal, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ListenAndServe は待ち受けている間ブロックするので、別の goroutine で動かす。
	//
	// バッファを1にしているのは、シャットダウン経路に入ったあとでも
	// この goroutine が送信して終了できるようにするためである。
	// Shutdown を呼ぶと ListenAndServe は http.ErrServerClosed を返して戻ってくる。
	// バッファが無いと、受け取り手が居ないまま送信でブロックして goroutine が残る。
	serveErr := make(chan error, 1)
	go func() {
		serveErr <- srv.ListenAndServe()
	}()

	logger.Info("server started", "addr", srv.Addr)

	select {
	case err := <-serveErr:
		// 待ち受けそのものに失敗した（ポートが使用中など）。
		// ここに来る時点でシャットダウンする対象が無い。
		logger.Error("server stopped", "error", err)
		os.Exit(1)

	case <-shutdownSignal.Done():
		// stop() でシグナルの捕捉を解除する。
		// これにより、2回目の SIGTERM や Ctrl+C は既定の動作（即終了）に戻る。
		// シャットダウンが長引いたときに、利用者が強制終了できる余地を残す。
		stop()
		logger.Info("shutdown started", "timeout", shutdownTimeout.String())
	}

	// Shutdown は、アイドルな接続を即座に閉じ、処理中のリクエストを待つ。
	// 新しい接続は受け付けなくなる。
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancelShutdown()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		// 待ち時間内に終わらなかった。処理中のリクエストは切られている。
		//
		// ここで os.Exit(1) すると defer db.Close() が走らないが、
		// プロセスが終わるので MySQL 側が接続を回収する。
		// 異常終了であることを終了コードで伝えるほうを優先する。
		logger.Error("shutdown timed out", "error", err)
		os.Exit(1)
	}

	logger.Info("shutdown completed")
}
