package handler

import "github.com/Natti3588/Ippo/backend/internal/api"

// Server は掲示板と認証のハンドラを集約する。
type Server struct {
	*BoardHandler
	*AuthHandler
}

// Server がapi.ServerInterfaceを十どうしているかコンパイル時に確認
var _ api.ServerInterface = (*Server)(nil)

func NewServer(board *BoardHandler, auth *AuthHandler) *Server {
	return &Server{BoardHandler: board, AuthHandler: auth}
}
