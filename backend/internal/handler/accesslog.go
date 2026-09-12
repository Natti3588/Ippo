package handler

import (
	"log/slog"
	"net/http"
	"time"
)

// statusRecorder は書き込まれたステータスとバイト数を覚える ResponseWriter。
//
// net/http はハンドラが WriteHeader を呼ばなくても、最初の Write で 200 を送る。
// そのため status の初期値を 200 にしておかないと、正常なレスポンスが
// ステータス 0 として記録される。
type statusRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

func (r *statusRecorder) Write(b []byte) (int, error) {
	n, err := r.ResponseWriter.Write(b)
	r.bytes += n
	return n, err
}

// AccessLog は1リクエストにつき1行を記録する。
//
// 必ず api.HandlerWithOptions が返したハンドラの「外側」に巻くこと。
// 生成された Middlewares に渡すと ServeMux の内側で動くため、
// 404 と 405 が記録されない。
//
// ログに出さないもの: リクエストボディ、Cookie、Authorization、クエリ文字列。
// クエリは今のところ sort しか無いので、出さなくても失うものが少ない。
// 「必要になったら足す」側に倒しておくと、将来 query に秘密が入っても漏れない。
func AccessLog(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(rec, r)

			level := slog.LevelInfo
			if rec.status >= 500 {
				level = slog.LevelError
			}

			logger.LogAttrs(r.Context(), level, "request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.Int("status", rec.status),
				slog.Int64("duration_ms", time.Since(start).Milliseconds()),
				slog.Int("bytes", rec.bytes),
			)
		})
	}
}
