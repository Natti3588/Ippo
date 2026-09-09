package repository

import (
	"fmt"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/google/uuid"
)

func toDomainTopic(t sqlcgen.Topic) (domain.Topic, error) {
	id, err := uuid.FromBytes(t.ID)
	if err != nil {
		return domain.Topic{}, fmt.Errorf("トピックIDの変換に失敗: %w", err)
	}
	return domain.Topic{Id: id.String(), Slug: t.Slug, Name: t.Name}, nil
}

func toDomainTopics(topics []sqlcgen.Topic) ([]domain.Topic, error) {
	out := make([]domain.Topic, 0, len(topics))
	for _, t := range topics {
		d, err := toDomainTopic(t)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

// toBinaryUUID はドメインの文字列 ID を BINARY(16) 用のバイト列にする。
func toBinaryUUID(s string) ([]byte, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return nil, fmt.Errorf("UUIDの解析に失敗: %w", err)
	}
	b, err := parsed.MarshalBinary()
	if err != nil {
		return nil, fmt.Errorf("UUIDのバイト列化に失敗: %w", err)
	}
	return b, nil
}

func toDomainPost(id []byte, body, authorName string, likeCount int64, createdAt time.Time) (domain.Post, error) {
	parsed, err := uuid.FromBytes(id)
	if err != nil {
		return domain.Post{}, fmt.Errorf("投稿IDの変換に失敗: %w", err)
	}
	return domain.Post{
		Id: parsed.String(), Body: body, AuthorName: authorName,
		LikeCount: int32(likeCount), CreatedAt: createdAt,
	}, nil
}

func postsFromPopular(rows []sqlcgen.ListPostsByTopicPopularRow) ([]domain.Post, error) {
	out := make([]domain.Post, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPost(r.ID, r.Body, r.AuthorName, r.LikeCount, r.CreatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromNewest(rows []sqlcgen.ListPostsByTopicNewestRow) ([]domain.Post, error) {
	out := make([]domain.Post, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPost(r.ID, r.Body, r.AuthorName, r.LikeCount, r.CreatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromOldest(rows []sqlcgen.ListPostsByTopicOldestRow) ([]domain.Post, error) {
	out := make([]domain.Post, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPost(r.ID, r.Body, r.AuthorName, r.LikeCount, r.CreatedAt)
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func toDomainUser(u sqlcgen.User) (domain.User, error) {
	id, err := uuid.FromBytes(u.ID)
	if err != nil {
		return domain.User{}, fmt.Errorf("利用者IDの変換に失敗: %w", err)
	}
	return domain.User{
		Id:           id.String(),
		Email:        u.Email,
		DisplayName:  u.DisplayName,
		PasswordHash: u.PasswordHash,
	}, nil
}

// toDomainUserFromSession はセッション取得の結果を利用者に変換する。
// このクエリは password_hash を SELECT していないため、ハッシュは空のままになる。
func toDomainUserFromSession(row sqlcgen.GetSessionWithUserRow) (domain.User, error) {
	id, err := uuid.FromBytes(row.UserID)
	if err != nil {
		return domain.User{}, fmt.Errorf("利用者IDの変換に失敗: %w", err)
	}
	return domain.User{
		Id:          id.String(),
		Email:       row.Email,
		DisplayName: row.DisplayName,
	}, nil
}
