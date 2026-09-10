package handler

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

// userContextKey は認証済みの利用者を context に載せるためのキー。
//
// 非公開の型なので、他のパッケージがこのキーを作ることはできない。
// 文字列をキーにすると、別のパッケージが同じ文字列を使ったときに
// 黙って上書きし合う。エラーは出ず、取り出したときに型が違うという形で現れる。
type userContextKey struct{}

func withUser(ctx context.Context, u domain.User) context.Context {
	return context.WithValue(ctx, userContextKey{}, u)
}

// userFrom は認証済みの利用者を取り出す。未ログインなら ok が false になる。
func userFrom(ctx context.Context) (domain.User, bool) {
	u, ok := ctx.Value(userContextKey{}).(domain.User)
	return u, ok
}
