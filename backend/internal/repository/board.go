package repository

import (
	"bytes"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
)

// mysqlErrNoReferencedRow は外部キー違反を表す MySQL のエラー番号（ER_NO_REFERENCED_ROW_2）。
const mysqlErrNoReferencedRow = 1452

type BoardRepository struct {
	q *sqlcgen.Queries
}

func NewBoardRepository(db *sql.DB) *BoardRepository {
	return &BoardRepository{q: sqlcgen.New(db)}
}

// GetTopic は指定のトピック の domain.Topic を返す。
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

// GetPost は投稿を1件、本文の全文つきで返す。
func (r *BoardRepository) GetPost(ctx context.Context, postID, viewerID string) (domain.Post, error) {
	id, err := toBinaryUUID(postID)
	if err != nil {
		return domain.Post{}, fmt.Errorf("投稿IDが不正: %w", domain.ErrNotFound)
	}

	vID, err := viewerBinaryUUID(viewerID)
	if err != nil {
		return domain.Post{}, err
	}

	row, err := r.q.GetPostById(ctx, sqlcgen.GetPostByIdParams{PostID: id, ViewerID: vID})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Post{}, fmt.Errorf("投稿が存在しません: %w", domain.ErrNotFound)
		}
		return domain.Post{}, err
	}

	parsed, err := uuid.FromBytes(row.ID)
	if err != nil {
		return domain.Post{}, fmt.Errorf("投稿IDの変換に失敗: %w", err)
	}
	authorID, err := uuid.FromBytes(row.AuthorID)
	if err != nil {
		return domain.Post{}, fmt.Errorf("投稿者IDの変換に失敗: %w", err)
	}
	topicID, err := uuid.FromBytes(row.TopicID)
	if err != nil {
		return domain.Post{}, fmt.Errorf("トピックIDの変換に失敗: %w", err)
	}
	return domain.Post{
		Id:         parsed.String(),
		AuthorID:   authorID.String(),
		Title:      row.Title,
		Body:       row.Body,
		AuthorName: row.AuthorName,
		LikeCount:  int32(row.LikeCount),
		LikedByMe:  row.LikedByMe,
		CreatedAt:  row.CreatedAt,
		Topic:      domain.Topic{Id: topicID.String(), Slug: row.TopicSlug, Name: row.TopicName},
	}, nil
}

// ListTopics は既存のトピックを一覧として返す。
func (r *BoardRepository) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	rows, err := r.q.ListTopics(ctx)
	if err != nil {
		return nil, err
	}
	return toDomainTopics(rows)
}

// ListPostsByTopic は指定のトピックの一覧を返す。
func (r *BoardRepository) ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder, viewerID string, limit, offset int32) ([]domain.PostSummary, error) {
	id, err := toBinaryUUID(topicID)
	if err != nil {
		return nil, err
	}

	vID, err := viewerBinaryUUID(viewerID)
	if err != nil {
		return nil, err
	}

	switch sort {
	case domain.SortPopular:
		rows, err := r.q.ListPostsByTopicPopular(ctx, sqlcgen.ListPostsByTopicPopularParams{TopicID: id, ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromPopular(rows)
	case domain.SortNewest:
		rows, err := r.q.ListPostsByTopicNewest(ctx, sqlcgen.ListPostsByTopicNewestParams{TopicID: id, ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromNewest(rows)
	case domain.SortOldest:
		rows, err := r.q.ListPostsByTopicOldest(ctx, sqlcgen.ListPostsByTopicOldestParams{TopicID: id, ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromOldest(rows)
	default:
		return nil, fmt.Errorf("未知の並び順: %q", sort)
	}
}

// ListPosts は投稿一覧をトピックに絞らず返す。
func (r *BoardRepository) ListPosts(ctx context.Context, sort domain.SortOrder, viewerID string, limit, offset int32) ([]domain.PostSummary, error) {
	vID, err := viewerBinaryUUID(viewerID)
	if err != nil {
		return nil, err
	}

	switch sort {
	case domain.SortPopular:
		rows, err := r.q.ListPostsByPopular(ctx, sqlcgen.ListPostsByPopularParams{ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromAllPopular(rows)
	case domain.SortNewest:
		rows, err := r.q.ListPostsByNewest(ctx, sqlcgen.ListPostsByNewestParams{ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromAllNewest(rows)
	case domain.SortOldest:
		rows, err := r.q.ListPostsByOldest(ctx, sqlcgen.ListPostsByOldestParams{ViewerID: vID, Limit: limit, Offset: offset})
		if err != nil {
			return nil, err
		}
		return postsFromAllOldest(rows)
	default:
		return nil, fmt.Errorf("未知の並び順: %q", sort)
	}
}

// CreatePost は投稿を作成し、作成した投稿を返す。
func (r *BoardRepository) CreatePost(ctx context.Context, topicID, authorID, title, body string) (domain.Post, error) {
	tID, err := toBinaryUUID(topicID)
	if err != nil {
		return domain.Post{}, err
	}

	aID, err := toBinaryUUID(authorID)
	if err != nil {
		return domain.Post{}, err
	}

	id, err := uuid.NewV7()
	if err != nil {
		return domain.Post{}, fmt.Errorf("UUIDの生成に失敗: %w", err)
	}

	b, err := id.MarshalBinary()
	if err != nil {
		return domain.Post{}, fmt.Errorf("UUIDのバイト列化に失敗: %w", err)
	}

	createdAt := time.Now().UTC().Truncate(time.Second)

	if err := r.q.CreatePost(ctx, sqlcgen.CreatePostParams{
		ID:        b,
		TopicID:   tID,
		AuthorID:  aID,
		Title:     title,
		Body:      body,
		CreatedAt: createdAt,
	}); err != nil {
		return domain.Post{}, err
	}

	return domain.Post{
		Id:        id.String(),
		AuthorID:  authorID,
		Title:     title,
		Body:      body,
		LikeCount: 0,
		LikedByMe: false,
		CreatedAt: createdAt,
	}, nil
}

// CreateLike はいいねを追加する。すでに押されている場合も成功として扱う。
// 存在しない投稿に対しては domain.ErrNotFound を返す。
func (r *BoardRepository) CreateLike(ctx context.Context, postID, authorID string) error {
	pID, err := toBinaryUUID(postID)
	if err != nil {
		return fmt.Errorf("投稿IDが不正: %w", domain.ErrNotFound)
	}

	aID, err := toBinaryUUID(authorID)
	if err != nil {
		return err
	}

	if err := r.q.CreateLike(ctx, sqlcgen.CreateLikeParams{PostID: pID, AuthorID: aID}); err != nil {
		if mysqlErr, ok := errors.AsType[*mysql.MySQLError](err); ok && mysqlErr.Number == mysqlErrNoReferencedRow {
			return fmt.Errorf("投稿が存在しません: %w", domain.ErrNotFound)
		}
		return err
	}
	return nil
}

// DeleteLike はいいねを取り消す。
// 押していないいいねを消しても、存在しない投稿を指していても成功とする。
func (r *BoardRepository) DeleteLike(ctx context.Context, postID, authorID string) error {
	pID, err := toBinaryUUID(postID)
	if err != nil {
		return nil
	}

	aID, err := toBinaryUUID(authorID)
	if err != nil {
		return err
	}

	return r.q.DeleteLike(ctx, sqlcgen.DeleteLikeParams{PostID: pID, AuthorID: aID})
}

// DeletePost は投稿を削除する。
//
// 他人の投稿には domain.ErrForbidden、存在しない投稿には domain.ErrNotFound を返す。
func (r *BoardRepository) DeletePost(ctx context.Context, postID, authorID string) error {
	pID, err := toBinaryUUID(postID)
	if err != nil {
		return fmt.Errorf("投稿IDが不正: %w", domain.ErrNotFound)
	}

	aID, err := toBinaryUUID(authorID)
	if err != nil {
		return err
	}

	owner, err := r.q.GetPostAuthor(ctx, pID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return fmt.Errorf("投稿が存在しません: %w", domain.ErrNotFound)
		}
		return err
	}

	if !bytes.Equal(owner, aID) {
		return fmt.Errorf("他人の投稿: %w", domain.ErrForbidden)
	}

	n, err := r.q.DeletePost(ctx, sqlcgen.DeletePostParams{ID: pID, AuthorID: aID})
	if err != nil {
		return err
	}
	if n == 0 {
		return fmt.Errorf("投稿が存在しません: %w", domain.ErrNotFound)
	}
	return nil
}
