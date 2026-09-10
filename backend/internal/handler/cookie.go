package handler

import (
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/service"
)

// sessionCookieName はセッション ID を運ぶ Cookie の名前。
// __Host- 接頭辞は Secure を必須にするため、ローカルの http で開発できなくなる。採らない。
const sessionCookieName = "ippo_session"

// setSessionCookie はセッションの生値を Cookie に載せる。
//
// Domain は指定しない。指定しないと、この Cookie は発行したホストにだけ送られる。
// MaxAge は Expires ではなく秒数で渡す。クライアントの時計がずれていても、
// 受け取った時点からの経過で数えられるためである。
// ただし Cookie の期限は本当の防御ではない。失効は sessions.expires_at で判定している。
func setSessionCookie(w http.ResponseWriter, rawSessionID string, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    rawSessionID,
		Path:     "/",
		MaxAge:   int(service.SessionLifetime.Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// clearSessionCookie はブラウザ側の Cookie を消す。
// サーバ側の失効は sessions の行の削除で行う。こちらは後始末である。
func clearSessionCookie(w http.ResponseWriter, secure bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}
