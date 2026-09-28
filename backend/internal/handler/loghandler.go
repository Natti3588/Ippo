package handler

import (
	"context"
	"log/slog"
)

// logHandler は context に載っている値をログの属性として足す slog.Handler。
type logHandler struct {
	slog.Handler
}

// NewLogHandler は inner を包んで、context 由来の属性を足すハンドラを返す。
func NewLogHandler(inner slog.Handler) slog.Handler {
	return logHandler{Handler: inner}
}

func (h logHandler) Handle(ctx context.Context, r slog.Record) error {
	if id := requestIDFrom(ctx); id != "" {
		r = r.Clone()
		r.AddAttrs(slog.String("request_id", id))
	}
	return h.Handler.Handle(ctx, r)
}

func (h logHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return logHandler{Handler: h.Handler.WithAttrs(attrs)}
}

func (h logHandler) WithGroup(name string) slog.Handler {
	return logHandler{Handler: h.Handler.WithGroup(name)}
}
