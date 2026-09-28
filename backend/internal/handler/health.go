package handler

import "net/http"

// Health は ALB のヘルスチェック用の経路。
//
// API の契約（TypeSpec）には載せない。ロードバランサが ECS タスクの生死を
// 見るためのもので、クライアントが使うものではないから。契約に載せると、
// 生成される型にもクライアントにも、誰も呼ばないものが増える。
func Health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
