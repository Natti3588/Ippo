package handler

import (
	"fmt"

	"github.com/Natti3588/Ippo/backend/internal/api"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/google/uuid"
	openapi_types "github.com/oapi-codegen/runtime/types"
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

func toDomainSortOrder(sort *api.SortOrder) (domain.SortOrder, bool) {
	if sort == nil {
		return domain.SortPopular, true
	}

	switch *sort {
	case api.Popular:
		return domain.SortPopular, true
	case api.Newest:
		return domain.SortNewest, true
	case api.Oldest:
		return domain.SortOldest, true
	default:
		return "", false
	}
}

// toAPIPost は投稿を API の形に変換する。
//
// isMine は viewerID との比較で決める。ドメインに持たせないのは、
// 「自分のものか」が投稿の属性ではなく、誰が見ているかによって変わるためである。
// authorId そのものは API に出さない。クライアントが他人の識別子を知る必要がない。
func toAPIPost(p domain.Post, viewerID string) (api.Post, error) {
	id, err := uuid.Parse(p.Id)
	if err != nil {
		return api.Post{}, fmt.Errorf("投稿ID: %qの解析に失敗: %w", p.Id, err)
	}

	return api.Post{
		Id:         id,
		Title:      p.Title,
		Body:       p.Body,
		AuthorName: p.AuthorName,
		LikeCount:  p.LikeCount,
		LikedByMe:  p.LikedByMe,
		IsMine:     viewerID != "" && p.AuthorID == viewerID,
		CreatedAt:  p.CreatedAt.UTC(),
		Topic:      api.Topic{Slug: p.Topic.Slug, Name: p.Topic.Name},
	}, nil
}

func toAPIPostSummaries(posts []domain.PostSummary, viewerID string) ([]api.PostSummary, error) {
	out := make([]api.PostSummary, 0, len(posts))
	for _, p := range posts {
		a, err := toAPIPostSummary(p, viewerID)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, nil
}

func toAPIPostSummary(p domain.PostSummary, viewerID string) (api.PostSummary, error) {
	id, err := uuid.Parse(p.Id)
	if err != nil {
		return api.PostSummary{}, fmt.Errorf("投稿ID: %qの解析に失敗: %w", p.Id, err)
	}

	return api.PostSummary{
		Id:          id,
		Title:       p.Title,
		BodyPreview: p.BodyPreview,
		Truncated:   p.Truncated,
		AuthorName:  p.AuthorName,
		LikeCount:   p.LikeCount,
		LikedByMe:   p.LikedByMe,
		IsMine:      viewerID != "" && p.AuthorID == viewerID,
		CreatedAt:   p.CreatedAt.UTC(),
	}, nil
}

func toAPICurrentUser(u domain.User) api.CurrentUser {
	return api.CurrentUser{
		Email:       openapi_types.Email(u.Email),
		DisplayName: u.DisplayName,
	}
}
