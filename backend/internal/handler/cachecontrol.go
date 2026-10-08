package handler

import "net/http"

const (
	cacheControlHeader = "Cache-Control"
	noStoreValue       = "no-store"
)

// NoStore は API のレスポンスがキャッシュされないようにする
func NoStore(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(cacheControlHeader, noStoreValue)
		next.ServeHTTP(w, r)
	})
}
