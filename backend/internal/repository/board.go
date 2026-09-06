package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository struct {
	q *sqlcgen.Queries
}

func NewBoardRepository(db *sql.DB) *BoardRepository {
	return &BoardRepository{q: sqlcgen.New(db)}
}

func (r *BoardRepository) GetTopic(ctx context.Context, slug string) (domain.Topic, error) {
	row, err := r.q.GetTopicBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Topic{}, fmt.Errorf("トピック %q: %w", slug, domain.ErrNotFound)
		}
		return domain.Topic{}, err
	}
	return toDomainTopic(row)
}

func (r *BoardRepository) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	rows, err := r.q.ListTopics(ctx)
	if err != nil {
		return nil, err
	}
	return toDomainTopics(rows)
}

func (r *BoardRepository) ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder) ([]domain.Post, error) {
	id, err := toBinaryUUID(topicID)
	if err != nil {
		return nil, err
	}

	switch sort {
	case domain.SortPopular:
		rows, err := r.q.ListPostsByTopicPopular(ctx, id)
		if err != nil {
			return nil, err
		}
		return postsFromPopular(rows)
	case domain.SortNewest:
		rows, err := r.q.ListPostsByTopicNewest(ctx, id)
		if err != nil {
			return nil, err
		}
		return postsFromNewest(rows)
	case domain.SortOldest:
		rows, err := r.q.ListPostsByTopicOldest(ctx, id)
		if err != nil {
			return nil, err
		}
		return postsFromOldest(rows)
	default:
		return nil, fmt.Errorf("未知の並び順: %q", sort)
	}
}
