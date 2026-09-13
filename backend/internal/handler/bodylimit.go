package handler

import "net/http"

// maxRequestBodyBytes はリクエストボディの上限。
//
// 正当な最大のリクエストは投稿作成で、タイトル100文字 + 本文15,000文字 = 15,100文字。
// JSON の文字列では、1文字がサロゲートペアのエスケープ（\uD83D\uDC68）で
// 最大12バイトになる。15,100 × 12 = 約177KiB。
// フィールド名などを足して 256KiB とした。
//
// 本文の「15,000文字以内」はサービス層でも検査しているが、そちらは
// json のデコードが終わったあとに走る。つまり守っているのは DB であって
// サーバーのメモリではない。読む前に切るのはこちらの役目である。
const maxRequestBodyBytes = 256 << 10 // 256 KiB

// LimitBody はリクエストボディの読み取りを maxRequestBodyBytes で打ち切る。
//
// 上限を超えたとき、ここではまだ何も起きない。
// 超過は r.Body を読んだ側（json.NewDecoder）でエラーになり、
// 各ハンドラの既存の「リクエストの形式が不正です」で 400 になる。
// エラーの扱いを1箇所に足さずに済むよう、意図的にこの形にしている。
func LimitBody(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		}
		next.ServeHTTP(w, r)
	})
}
