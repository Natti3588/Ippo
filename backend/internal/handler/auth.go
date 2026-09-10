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
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	user, sess, err := h.svc.SignUp(r.Context(), string(req.Email), req.Password, req.DisplayName)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidInput):
			w.WriteHeader(http.StatusBadRequest)
		case errors.Is(err, domain.ErrEmailTaken):
			w.WriteHeader(http.StatusConflict)
		default:
			h.logger.Error("サインアップに失敗", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
		}
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
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	user, sess, err := h.svc.Login(r.Context(), string(req.Email), req.Password)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			w.WriteHeader(http.StatusUnauthorized)
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
		w.WriteHeader(http.StatusUnauthorized)
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
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var req api.MeUpdateJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	updated, err := h.svc.UpdateDisplayName(r.Context(), user, req.DisplayName)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidInput) {
			w.WriteHeader(http.StatusBadRequest)
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
