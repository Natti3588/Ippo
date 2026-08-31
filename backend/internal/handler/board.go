package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/service"
)

type BoardHandler struct {
	svc    *service.BoardService
	logger *slog.Logger
}

func NewBoardHandler(svc *service.BoardService, logger *slog.Logger) *BoardHandler {
	return &BoardHandler{svc: svc}
}

func (h *BoardHandler) TopicsList(w http.ResponseWriter, r *http.Request) {
	topics, err := h.svc.ListTopics(r.Context())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		h.logger.Error("failed to list topics", "error", err)
		return
	}
	apiTopics := toAPITopics(topics)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apiTopics); err != nil {
		h.logger.Error("failed to encode response", "error", err)
		return
	}
}

func (h *BoardHandler) TopicsListPosts(w http.ResponseWriter, r *http.Request, slug string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *BoardHandler) TopicsCreatePost(w http.ResponseWriter, r *http.Request, slug string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *BoardHandler) PostsLike(w http.ResponseWriter, r *http.Request, slug string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *BoardHandler) PostsUnlike(w http.ResponseWriter, r *http.Request, slug string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}
