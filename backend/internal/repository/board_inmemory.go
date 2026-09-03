package repository

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type InMemoryBoard struct {
	topics []domain.Topic
}

func NewInMemoryBoard() *InMemoryBoard {
	return &InMemoryBoard{
		topics: []domain.Topic{
			{Slug: "study-method", Name: "効率的な勉強法"},
			{Slug: "motivation", Name: "モチベーション"},
			{Slug: "free-resources", Name: "無料の教材"},
		},
	}
}

func (r *InMemoryBoard) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return r.topics, nil
}
