package repository

import (
	"fmt"
	"time"
	"unicode/utf8"

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

// summaryRow は一覧クエリ3種の行から、変換に必要な値だけを取り出した中間表現。
type summaryRow struct {
	ID          []byte
	AuthorID    []byte
	Title       string
	TopicSlug   string
	TopicName   string
	BodyPreview string
	BodyLength  int64
	AuthorName  string
	LikeCount   int64
	LikedByMe   bool
	CreatedAt   time.Time
}

// toDomainPostSummary は一覧の1行を要約に変換する。
func toDomainPostSummary(r summaryRow) (domain.PostSummary, error) {
	parsed, err := uuid.FromBytes(r.ID)
	if err != nil {
		return domain.PostSummary{}, fmt.Errorf("投稿IDの変換に失敗: %w", err)
	}
	author, err := uuid.FromBytes(r.AuthorID)
	if err != nil {
		return domain.PostSummary{}, fmt.Errorf("投稿者IDの変換に失敗: %w", err)
	}
	return domain.PostSummary{
		Id:          parsed.String(),
		AuthorID:    author.String(),
		Topic:       domain.Topic{Slug: r.TopicSlug, Name: r.TopicName},
		Title:       r.Title,
		BodyPreview: r.BodyPreview,
		Truncated:   r.BodyLength > int64(utf8.RuneCountInString(r.BodyPreview)),
		AuthorName:  r.AuthorName,
		LikeCount:   int32(r.LikeCount),
		LikedByMe:   r.LikedByMe,
		CreatedAt:   r.CreatedAt,
	}, nil
}

func postsFromAllPopular(rows []sqlcgen.ListPostsByPopularRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			TopicSlug:   r.TopicSlug,
			TopicName:   r.TopicName,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromAllNewest(rows []sqlcgen.ListPostsByNewestRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			TopicSlug:   r.TopicSlug,
			TopicName:   r.TopicName,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromAllOldest(rows []sqlcgen.ListPostsByOldestRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			TopicSlug:   r.TopicSlug,
			TopicName:   r.TopicName,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromPopular(rows []sqlcgen.ListPostsByTopicPopularRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromNewest(rows []sqlcgen.ListPostsByTopicNewestRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

func postsFromOldest(rows []sqlcgen.ListPostsByTopicOldestRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID:    r.AuthorID,
			Title:       r.Title,
			BodyPreview: r.BodyPreview,
			BodyLength:  int64(r.BodyLength),
			AuthorName:  r.AuthorName,
			LikeCount:   r.LikeCount,
			LikedByMe:   r.LikedByMe,
			CreatedAt:   r.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, nil
}

// viewerBinaryUUID は閲覧者の ID を BINARY(16) 用のバイト列にする。
//
// 未ログイン（空文字）のときは nil を返す。
func viewerBinaryUUID(viewerID string) ([]byte, error) {
	if viewerID == "" {
		return nil, nil
	}
	return toBinaryUUID(viewerID)
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

// toDomainUserFromSession はセッション取得の結果を User に変換する。
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
