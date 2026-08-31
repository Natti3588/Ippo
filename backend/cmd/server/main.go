package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/handler"
	"github.com/Natti3588/Ippo/backend/internal/repository"
	"github.com/Natti3588/Ippo/backend/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	repo := repository.NewInMemoryBoardRepository()
	svc := service.NewBoardService(repo)
	h := handler.NewBoardHandler(svc, logger)

	logger.Info("server started", "addr", ":8080")
	if err := http.ListenAndServe(":8080", api.Handler(h)); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
