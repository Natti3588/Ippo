package handler

import (
	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/domain"
)

func toAPITopics(topics []domain.Topic) []api.Topic {
	out := make([]api.Topic, 0, len(topics))
	for _, t := range topics {
		out = append(out, api.Topic{
			Slug: t.Slug,
			Name: t.Name,
		})
	}
	return out
}
