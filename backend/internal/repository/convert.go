package repository

import (
	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
)

func toDomainTopics(topics []sqlcgen.Topic) []domain.Topic {
	out := make([]domain.Topic, 0, len(topics))

	for _, t := range topics {
		out = append(out, domain.Topic{
			Slug: t.Slug,
			Name: t.Name,
		})
	}
	return out
}
