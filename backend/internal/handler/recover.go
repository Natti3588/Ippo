package handler

import (
	"log/slog"
	"net/http"
	"runtime/debug"
)

// writeWatcher は応答を書き始めたかどうかを覚える ResponseWriter。
type writeWatcher struct {
	http.ResponseWriter
	wrote bool
}

func (w *writeWatcher) WriteHeader(status int) {
	w.wrote = true
	w.ResponseWriter.WriteHeader(status)
}

func (w *writeWatcher) Write(b []byte) (int, error) {
	w.wrote = true
	return w.ResponseWriter.Write(b)
}

func Recover(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ww := &writeWatcher{ResponseWriter: w}
			defer func() {
				v := recover()
				if v == nil {
					return
				}
				if v == http.ErrAbortHandler {
					panic(v)
				}
				logger.ErrorContext(r.Context(), "panic が発生", "panic", v, "stack", string(debug.Stack()))
				if ww.wrote {
					panic(http.ErrAbortHandler)
				}
				writeInternalServerError(r.Context(), w, logger)
			}()
			next.ServeHTTP(ww, r)
		})
	}
}
