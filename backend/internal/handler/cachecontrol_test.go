package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNoStore(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	h := NoStore(next)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/topics", nil)
	h.ServeHTTP(rec, req)

	if got := rec.Header().Get(cacheControlHeader); got != noStoreValue {
		t.Errorf("Cache-Control = %q, want %q", got, noStoreValue)
	}
}
