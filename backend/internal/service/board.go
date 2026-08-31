package service

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository interface {
	ListTopics(context.Context) ([]domain.Topic, error)
}

type BoardService struct {
	repo BoardRepository
}

func NewBoardService(repo BoardRepository) *BoardService {
	return &BoardService{repo: repo}
}

func (s *BoardService) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return s.repo.ListTopics(ctx)
}
