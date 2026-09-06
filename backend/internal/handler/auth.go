package handler

import (
	"log/slog"
	"net/http"
)

type AuthHandler struct {
	logger *slog.Logger
}

func NewAuthHandler(logger *slog.Logger) *AuthHandler {
	return &AuthHandler{logger: logger}
}

func (h *AuthHandler) AuthSignup(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *AuthHandler) AuthLogin(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *AuthHandler) AuthLogout(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *AuthHandler) MeGet(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}

func (h *AuthHandler) MeUpdate(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusNotImplemented)
}
