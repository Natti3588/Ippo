package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/Natti3588/Ippo/backend/internal/service"
)

type BoardHandler struct {
	svc    *service.BoardService
	logger *slog.Logger
}

func NewBoardHandler(svc *service.BoardService, logger *slog.Logger) *BoardHandler {
	return &BoardHandler{svc: svc, logger: logger}
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

func (h *BoardHandler) TopicsListPosts(w http.ResponseWriter, r *http.Request, slug string, params api.TopicsListPostsParams) {
	sort, ok := toDomainSortOrder(params.Sort)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	posts, err := h.svc.ListPosts(r.Context(), slug, sort)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		h.logger.Error("failed to list posts", "error", err, "slug", slug)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	apiPosts, err := toAPIPosts(posts)
	if err != nil {
		h.logger.Error("failed to convert posts", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apiPosts); err != nil {
		h.logger.Error("failed to encode response", "error", err)
	}
}

func (h *BoardHandler) TopicsCreatePost(w http.ResponseWriter, r *http.Request, slug string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *BoardHandler) PostsLike(w http.ResponseWriter, r *http.Request, postId string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *BoardHandler) PostsUnlike(w http.ResponseWriter, r *http.Request, postId string) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}
