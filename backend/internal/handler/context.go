package handler

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

// userContextKey は認証済みの利用者を context に載せるためのキー。
type userContextKey struct{}

func withUser(ctx context.Context, u domain.User) context.Context {
	return context.WithValue(ctx, userContextKey{}, u)
}

// userFrom は認証済みの利用者を取り出す。未ログインなら ok が false になる。
func userFrom(ctx context.Context) (domain.User, bool) {
	u, ok := ctx.Value(userContextKey{}).(domain.User)
	return u, ok
}

// requestIDContextKey はリクエストIDを context に載せるためのキー。
type requestIDContextKey struct{}

func withRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDContextKey{}, id)
}

// requestIDFrom はリクエストIDを取り出す。ミドルウェアを通っていなければ空文字。
func requestIDFrom(ctx context.Context) string {
	id, _ := ctx.Value(requestIDContextKey{}).(string)
	return id
}
