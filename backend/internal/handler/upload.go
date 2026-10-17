package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/Natti3588/Ippo/backend/internal/service"
)

type UploadHandler struct {
	svc    *service.UploadService
	logger *slog.Logger
}

func NewUploadHandler(svc *service.UploadService, logger *slog.Logger) *UploadHandler {
	return &UploadHandler{svc: svc, logger: logger}
}

func (h *UploadHandler) UploadsCreate(w http.ResponseWriter, r *http.Request) {
	_, ok := userFrom(r.Context())
	if !ok {
		writeProblem(r.Context(), w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	ticket, err := h.svc.CreateTicket(r.Context())
	if err != nil {
		if errors.Is(err, domain.ErrUploadUnavailable) {
			writeProblem(r.Context(), w, h.logger, http.StatusServiceUnavailable, "いまは画像を使えません")
			return
		}
		h.logger.ErrorContext(r.Context(), "許可証の作成に失敗", "error", err)
		writeInternalServerError(r.Context(), w, h.logger)
		return
	}

	apiTicket := toAPIUploadTicket(ticket)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apiTicket); err != nil {
		h.logger.ErrorContext(r.Context(), "レスポンスの書き込みに失敗", "error", err)
	}
}
