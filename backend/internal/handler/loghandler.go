package handler

import (
	"context"
	"log/slog"
)

// logHandler は context に載っている値をログの属性として足す slog.Handler。
//
// これを挟むと、呼び出し側は request_id を書かなくてよくなる。
// 代わりに context を渡す必要がある（Info ではなく InfoContext を使う）。
//
// 足す属性を増やしたいときは Handle に1行足す。
// 呼び出し箇所を1つも触らずに、すべてのログ行に反映される。
type logHandler struct {
	slog.Handler
}

// NewLogHandler は inner を包んで、context 由来の属性を足すハンドラを返す。
func NewLogHandler(inner slog.Handler) slog.Handler {
	return logHandler{Handler: inner}
}

func (h logHandler) Handle(ctx context.Context, r slog.Record) error {
	if id := requestIDFrom(ctx); id != "" {
		r.Clone()
		r.AddAttrs(slog.String("request_id", id))
	}
	return h.Handler.Handle(ctx, r)
}

// WithAttrs と WithGroup を自分で実装しているのは、埋め込みに任せると
// inner のメソッドが inner 自身を返し、この包みが外れてしまうためである。
//
// 外れてもコンパイルは通る。logger.With(...) で派生させたロガーだけが
// 静かに request_id を失う、という形で現れる。
//
// ただし WithGroups を通したロガーでは、request_idはそのグループの内側に入る
// ({"db":{"request_id": "..."}}になる)。 レコードの属性は開いているグループの
// 中に書かれるためである。 トップレベルで検索したいなら WithGroup を使わないこと。
func (h logHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return logHandler{Handler: h.Handler.WithAttrs(attrs)}
}

func (h logHandler) WithGroup(name string) slog.Handler {
	return logHandler{Handler: h.Handler.WithGroup(name)}
}
