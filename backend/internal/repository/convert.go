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
//
// 引数を構造体にしているのは、bodyPreview と authorName がどちらも string で、
// 位置を入れ替えてもコンパイルが通ってしまうためである。
// フィールド名で渡せば入れ替えようがない。
type summaryRow struct {
	ID          []byte
	AuthorID    []byte
	Title       string
	BodyPreview string
	BodyLength  int64
	AuthorName  string
	LikeCount   int64
	LikedByMe   bool
	CreatedAt   time.Time
}

// toDomainPostSummary は一覧の1行を要約に変換する。
//
// Truncated は「全文の文字数 > プレビューの文字数」で決める。
// プレビューの長さを Go 側の定数で持たないのは、SQL の LEFT() に書いた値と
// 定数が食い違っても、どちらもエラーにならないためである。
// プレビュー自身の長さを数えれば、この2つはずれようがない。
//
// ただしこの方法で防げるのは SQL と Go のずれだけである。
// LEFT(p.body, 200) は posts.sql に3回現れ、1本だけ長さを変えても
// そのクエリの中では Truncated が正しく計算されてしまう。
// 同じ投稿が並び順によって違う長さのプレビューを返すだけで、何もエラーにならない。
// 3本の 200 は必ず揃えて変えること。
//
// utf8.RuneCountInString を使うのは、MySQL の CHAR_LENGTH() が
// コードポイントを数えるため、単位を揃える必要があるからである。
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
		Title:       r.Title,
		BodyPreview: r.BodyPreview,
		Truncated:   r.BodyLength > int64(utf8.RuneCountInString(r.BodyPreview)),
		AuthorName:  r.AuthorName,
		LikeCount:   int32(r.LikeCount),
		LikedByMe:   r.LikedByMe,
		CreatedAt:   r.CreatedAt,
	}, nil
}

func postsFromPopular(rows []sqlcgen.ListPostsByTopicPopularRow) ([]domain.PostSummary, error) {
	out := make([]domain.PostSummary, 0, len(rows))
	for _, r := range rows {
		d, err := toDomainPostSummary(summaryRow{
			ID:          r.ID,
			AuthorID: r.AuthorID,
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
			AuthorID: r.AuthorID,
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
			AuthorID: r.AuthorID,
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
// 未ログイン（空文字）のときは nil を返す。SQL 側では
// ml.author_id = NULL が常に偽になるため、liked_by_me は false になる。
// 「未ログインを表す値」をこの1箇所に閉じ込めておく。
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
