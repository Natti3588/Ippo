package handler

import "net/http"

// Health は ALB のヘルスチェック用の経路。
//
// API の契約（TypeSpec）には載せない。ロードバランサが ECS タスクの生死を
// 見るためのもので、クライアントが使うものではないから。契約に載せると、
// 生成される型にもクライアントにも、誰も呼ばないものが増える。
//
// DB を見ないのは意図的。ここで DB を見ると、DB が一瞬詰まっただけで
// ALB がタスクを入れ替えにいき、新しいタスクも同じ DB で詰まる。
// ここが答えるのは「このプロセスが生きているか」だけでよい。
func Health(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}
