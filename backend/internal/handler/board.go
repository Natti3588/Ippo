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
		h.logger.Info("並び順の指定が不正です", "op", "listPosts")
		writeProblem(w, h.logger, http.StatusBadRequest, "並び順の指定が不正です")
		return
	}

	posts, err := h.svc.ListPosts(r.Context(), slug, sort)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeProblem(w, h.logger, http.StatusNotFound, "トピックが見つかりません")
			return
		}
		h.logger.Error("failed to list posts", "error", err, "slug", slug)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	apiPosts, err := toAPIPostSummaries(posts)
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

func (h *BoardHandler) PostsGet(w http.ResponseWriter, r *http.Request, postId string) {
	post, err := h.svc.GetPost(r.Context(), postId)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeProblem(w, h.logger, http.StatusNotFound, "投稿が見つかりません")
			return
		}
		h.logger.Error("投稿の取得に失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	apiPost, err := toAPIPost(post)
	if err != nil {
		h.logger.Error("投稿の変換に失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(apiPost); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *BoardHandler) TopicsCreatePost(w http.ResponseWriter, r *http.Request, slug string) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	var req api.TopicsCreatePostJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Info("リクエストを解釈できません", "error", err, "op", "createPost")
		writeProblem(w, h.logger, http.StatusBadRequest, "リクエストの形式が不正です")
		return
	}

	post, err := h.svc.CreatePost(r.Context(), slug, user, req.Title, req.Body)
	if err != nil {
		if e, ok := errors.AsType[*domain.InvalidInputError](err); ok {
			h.logger.Info("入力が不正", "error", err, "op", "createPost")
			writeProblem(w, h.logger, http.StatusBadRequest, e.Detail)
			return
		}
		if errors.Is(err, domain.ErrNotFound) {
			writeProblem(w, h.logger, http.StatusNotFound, "トピックが見つかりません")
			return
		}
		h.logger.Error("投稿の作成に失敗", "error", err, "slug", slug)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	apiPost, err := toAPIPost(post)
	if err != nil {
		h.logger.Error("投稿の変換に失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(apiPost); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *BoardHandler) PostsLike(w http.ResponseWriter, r *http.Request, postId string) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	if err := h.svc.Like(r.Context(), postId, user.Id); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			writeProblem(w, h.logger, http.StatusNotFound, "投稿が見つかりません")
			return
		}
		h.logger.Error("いいねの追加に失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) PostsUnlike(w http.ResponseWriter, r *http.Request, postId string) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	if err := h.svc.Unlike(r.Context(), postId, user.Id); err != nil {
		h.logger.Error("いいねの取り消しに失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
