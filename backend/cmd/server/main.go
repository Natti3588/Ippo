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
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

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

	repo := repository.NewBoardRepository(db)
	svc := service.NewBoardService(repo)
	boardHandler := handler.NewBoardHandler(svc, logger)
	authHandler := handler.NewAuthHandler(logger)
	h := handler.NewServer(boardHandler, authHandler)

	logger.Info("server started", "addr", ":8080")
	if err := http.ListenAndServe(":8080", api.Handler(h)); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
