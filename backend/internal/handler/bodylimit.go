package handler

import "net/http"

// maxRequestBodyBytes はリクエストボディの上限。
const maxRequestBodyBytes = 256 << 10 // 256 KiB

// LimitBody はリクエストボディの読み取りを maxRequestBodyBytes で打ち切る。
func LimitBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		}
		next.ServeHTTP(w, r)
	})
}
