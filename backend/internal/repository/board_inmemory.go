package repository

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type InMemoryBoardRepository struct {
	topics []domain.Topic
}

func NewInMemoryBoardRepository() *InMemoryBoardRepository {
	return &InMemoryBoardRepository{
		topics: []domain.Topic{
			{Slug: "study-method", Name: "効率的な勉強法"},
			{Slug: "motivation", Name: "モチベーション"},
			{Slug: "free-resource", Name: "無料の教材"},
		},
	}
}

func (r *InMemoryBoardRepository) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return r.topics, nil
}
