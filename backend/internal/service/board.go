package service

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository interface {
	ListTopics(ctx context.Context) ([]domain.Topic, error)
	GetTopic(ctx context.Context, slug string) (domain.Topic, error)
	ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder) ([]domain.Post, error)
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

func (s *BoardService) ListPosts(ctx context.Context, slug string, sort domain.SortOrder) ([]domain.Post, error) {
	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return nil, err
	}

	return s.repo.ListPostsByTopic(ctx, topic.Id, sort)
}
