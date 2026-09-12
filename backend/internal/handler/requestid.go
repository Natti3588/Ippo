package handler

import (
	"net/http"

	"github.com/google/uuid"
)

// requestIDHeader は発行したIDを利用者に返すヘッダ名。
// 利用者が「このIDで不具合が出た」と言えるようにするためにある。
const requestIDHeader = "X-Request-Id"

// RequestID はリクエストごとにIDを発行し、context とレスポンスヘッダに載せる。
//
// AccessLog より外側に巻くこと。内側に巻くと、AccessLog が受け取る
// リクエストにはまだIDが載っていない。
//
// UUID の生成に失敗したときはIDなしで続行する。
// ログのためにリクエストを落とすのは本末転倒である。
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
