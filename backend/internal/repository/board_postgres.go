package repository

import (
	"context"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresBoard struct {
	q *sqlcgen.Queries
}

func NewPostgresBoard(pool *pgxpool.Pool) *PostgresBoard {
	return &PostgresBoard{q: sqlcgen.New(pool)}
}

func (r *PostgresBoard) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	rows, err := r.q.ListTopics(ctx)
	if err != nil {
		return nil, err
	}

	topics := toDomainTopics(rows)
	return topics, nil
}
