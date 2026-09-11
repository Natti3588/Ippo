package repository

import (
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

// CreatePost は投稿を作成し、作成した投稿を返す。
// MySQL に RETURNING が無いため、ID と作成時刻は INSERT の前に Go 側で決める。
// AuthorName は posts に持たないため、ここでは埋めない。呼び出し側が埋める。
func (r *BoardRepository) CreatePost(ctx context.Context, topicID, authorID, body string) (domain.Post, error) {
	tID, err := toBinaryUUID(topicID)
	if err != nil {
		return domain.Post{}, err
	}

	aID, err := toBinaryUUID(authorID)
	if err != nil {
		return domain.Post{}, err
	}

	// v7 は先頭48ビットがミリ秒のタイムスタンプなので、主キーが時刻順に並ぶ。
	// これにより posts の一覧で id を第2・第3ソートキーに使ったとき、
	// この変更以降に作られた投稿どうしは、同じ秒でも実際の作成順に並ぶ。
	// v4 で採番された既存の行は先頭バイトが乱数なので、この性質を持たない。
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
		Body:      body,
		CreatedAt: createdAt,
	}); err != nil {
		return domain.Post{}, err
	}

	return domain.Post{
		Id:        id.String(),
		Body:      body,
		LikeCount: 0,
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
