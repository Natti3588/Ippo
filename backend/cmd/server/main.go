package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/database"
	"github.com/Natti3588/Ippo/backend/internal/handler"
	"github.com/Natti3588/Ippo/backend/internal/repository"
	"github.com/Natti3588/Ippo/backend/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		logger.Error("環境変数 DATABASE_URL が設定されていません")
		os.Exit(1)
	}

	if err := database.Migrate(databaseURL); err != nil {
		logger.Error("マイグレーションに失敗", "error", err)
		os.Exit(1)
	}
	logger.Info("migration applied")

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		logger.Error("コネクションプールの作成に失敗", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		logger.Error("データベースに接続できません", "error", err)
		os.Exit(1)
	}
	logger.Info("database connected")

	repo := repository.NewPostgresBoard(pool)
	svc := service.NewBoardService(repo)
	h := handler.NewBoardHandler(svc, logger)

	logger.Info("server started", "addr", ":8080")
	if err := http.ListenAndServe(":8080", api.Handler(h)); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
