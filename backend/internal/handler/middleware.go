package handler

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/Natti3588/Ippo/backend/internal/service"
)

type AuthMiddleware struct {
	svc    *service.AuthService
	logger *slog.Logger
}

func NewAuthMiddleware(svc *service.AuthService, logger *slog.Logger) *AuthMiddleware {
	return &AuthMiddleware{svc: svc, logger: logger}
}

// Attach は Cookie があれば利用者を context に載せる。認証を要求はしない。
//
// このミドルウェアは全経路に適用される。/topics は未ログインでも見えるため、
// ここで拒否してはならない。認証を要求するかどうかは各ハンドラが userFrom で決める。
func (m *AuthMiddleware) Attach(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie(sessionCookieName)
		if err != nil || c.Value == "" {
			next.ServeHTTP(w, r)
			return
		}

		user, err := m.svc.Authenticate(r.Context(), c.Value)
		switch {
		case errors.Is(err, domain.ErrNotFound):
			next.ServeHTTP(w, r)
		case err != nil:
			m.logger.Error("セッションの照会に失敗", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
		default:
			next.ServeHTTP(w, r.WithContext(withUser(r.Context(), user)))
		}
	})
}
