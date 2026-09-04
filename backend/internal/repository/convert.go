package repository

import (
	"uuid"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
)

func toDomainTopics(topics []sqlcgen.Topic) []domain.Topic {
	out := make([]domain.Topic, 0, len(topics))

	for _, t := range topics {
		out = append(out, domain.Topic{
			Id:   uuid.UUID(t.ID.Bytes).String(),
			Slug: t.Slug,
			Name: t.Name,
		})
	}
	return out
}
