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

type AuthHandler struct {
	svc          *service.AuthService
	logger       *slog.Logger
	secureCookie bool
}

func NewAuthHandler(svc *service.AuthService, logger *slog.Logger, secureCookie bool) *AuthHandler {
	return &AuthHandler{svc: svc, logger: logger, secureCookie: secureCookie}
}

func (h *AuthHandler) AuthSignup(w http.ResponseWriter, r *http.Request) {
	var req api.AuthSignupJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Info("リクエストを解釈できません", "error", err, "op", "signup")
		writeProblem(w, h.logger, http.StatusBadRequest, "リクエストの形式が不正です")
		return
	}

	user, sess, err := h.svc.SignUp(r.Context(), string(req.Email), req.Password, req.DisplayName)
	if err != nil {
		if e, ok := errors.AsType[*domain.InvalidInputError](err); ok {
			h.logger.Info("入力が不正", "error", err, "op", "signup")
			writeProblem(w, h.logger, http.StatusBadRequest, e.Detail)
			return
		}
		if errors.Is(err, domain.ErrEmailTaken) {
			writeProblem(w, h.logger, http.StatusConflict, "このメールアドレスは既に使われています")
			return
		}
		h.logger.Error("サインアップに失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	setSessionCookie(w, sess.ID, h.secureCookie)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(toAPICurrentUser(user)); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *AuthHandler) AuthLogin(w http.ResponseWriter, r *http.Request) {
	var req api.AuthLoginJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Info("リクエストを解釈できません", "error", err, "op", "login")
		writeProblem(w, h.logger, http.StatusBadRequest, "リクエストの形式が不正です")
		return
	}

	user, sess, err := h.svc.Login(r.Context(), string(req.Email), req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			writeProblem(w, h.logger, http.StatusUnauthorized, "メールアドレスまたはパスワードが違います")
			return
		}
		h.logger.Error("ログインに失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	setSessionCookie(w, sess.ID, h.secureCookie)
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(toAPICurrentUser(user)); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *AuthHandler) AuthLogout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(sessionCookieName); err == nil && c.Value != "" {
		if err := h.svc.Logout(r.Context(), c.Value); err != nil {
			h.logger.Error("ログアウトに失敗", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	clearSessionCookie(w, h.secureCookie)
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) MeGet(w http.ResponseWriter, r *http.Request) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(toAPICurrentUser(user)); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}

func (h *AuthHandler) MeUpdate(w http.ResponseWriter, r *http.Request) {
	user, ok := userFrom(r.Context())
	if !ok {
		writeProblem(w, h.logger, http.StatusUnauthorized, "ログインが必要です")
		return
	}

	var req api.MeUpdateJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Info("リクエストを解釈できません", "error", err, "op", "meUpdate")
		writeProblem(w, h.logger, http.StatusBadRequest, "リクエストの形式が不正です")
		return
	}

	updated, err := h.svc.UpdateDisplayName(r.Context(), user, req.DisplayName)
	if err != nil {
		if e, ok := errors.AsType[*domain.InvalidInputError](err); ok {
			h.logger.Info("入力が不正", "error", err, "op", "meUpdate")
			writeProblem(w, h.logger, http.StatusBadRequest, e.Detail)
			return
		}
		h.logger.Error("表示名の変更に失敗", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(toAPICurrentUser(updated)); err != nil {
		h.logger.Error("レスポンスの書き込みに失敗", "error", err)
	}
}
