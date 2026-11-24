package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/Natti3588/Ippo/backend/internal/service"
)

type StudyHandler struct {
	svc    *service.StudyService
	logger *slog.Logger
}

func NewStudyHandler(svc *service.StudyService, logger *slog.Logger) *StudyHandler {
	return &StudyHandler{svc: svc, logger: logger}
}

func (h *StudyHandler) StudyGet(w http.ResponseWriter, r *http.Request) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(r.Context(), w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	summary, err := h.svc.Summary(r.Context(), user.Id)
	if err != nil {
		h.logger.ErrorContext(r.Context(), "学習記録の取得に失敗", "error", err)
		writeInternalServerError(r.Context(), w, h.logger)
		return
	}

	apiSummary := toAPIStudySummary(summary)
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(apiSummary); err != nil {
		h.logger.ErrorContext(r.Context(), "レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *StudyHandler) StudyRecordToday(w http.ResponseWriter, r *http.Request) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(r.Context(), w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	summary, err := h.svc.Record(r.Context(), user.Id)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeProblem(r.Context(), w, h.logger, http.StatusUnauthorized, "ログインが必要です")
			return
		}
		h.logger.ErrorContext(r.Context(), "学習記録を付ける処理に失敗", "error", err)
		writeInternalServerError(r.Context(), w, h.logger)
		return
	}

	apiSummary := toAPIStudySummary(summary)
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(apiSummary); err != nil {
		h.logger.ErrorContext(r.Context(), "レスポンスの書き込みに失敗", "error", err)
	}
}
