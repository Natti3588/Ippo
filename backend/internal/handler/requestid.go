package handler

import (
	"net/http"

	"github.com/google/uuid"
)

// requestIDHeader は発行したIDを利用者に返すHTTPヘッダー名
const requestIDHeader = "X-Request-Id"

// RequestID はリクエストごとにIDを発行し、context とレスポンスヘッダに載せる。
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, err := uuid.NewV7()
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		s := id.String()
		w.Header().Set(requestIDHeader, s)
		next.ServeHTTP(w, r.WithContext(withRequestID(r.Context(), s)))
	})
}
