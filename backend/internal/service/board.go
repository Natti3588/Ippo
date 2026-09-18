package service

import (
	"context"
	"unicode/utf8"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository interface {
	ListTopics(ctx context.Context) ([]domain.Topic, error)
	GetTopic(ctx context.Context, slug string) (domain.Topic, error)
	GetPost(ctx context.Context, postID, viewerID string) (domain.Post, error)
	ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder, viewerID string, limit, offset int32) ([]domain.PostSummary, error)
	CreatePost(ctx context.Context, topicID, authorID, title, body string) (domain.Post, error)
	CreateLike(ctx context.Context, postID, authorID string) error
	DeleteLike(ctx context.Context, postID, authorID string) error
	DeletePost(ctx context.Context, postID, authorID string) error
}

// 本文の長さは文字で数える。DB の chk_posts_body が CHAR_LENGTH() だからである。
//
// 15,000 は TEXT の上限から決めた。utf8mb4 の1文字は最大4バイトなので、
// 15,000文字 × 4 = 60,000バイト < 65,535バイト（TEXT の上限）に収まる。
// これ以上広げるなら列を MEDIUMTEXT に変える必要がある。
const (
	minPostBodyChars = 1
	maxPostBodyChars = 15000
)

// タイトルの長さも文字で数える。DB の chk_posts_title が CHAR_LENGTH() で、
// 契約の @maxLength が文字数で、列の VARCHAR(100) も文字数である。
// 4者すべてが同じ単位で 100 を意味している。
const (
	minPostTitleChars = 1
	maxPostTitleChars = 100
)

type BoardService struct {
	repo BoardRepository
}

// PageSize は一覧1ページの件数。クライアントからは変えられない。
const PageSize int32 = 10

func NewBoardService(repo BoardRepository) *BoardService {
	return &BoardService{repo: repo}
}

func (s *BoardService) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return s.repo.ListTopics(ctx)
}

func (s *BoardService) ListPosts(ctx context.Context, slug string, sort domain.SortOrder, viewerID string, page int32) (domain.PostPage, error) {
	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return domain.PostPage{}, err
	}

	rows, err := s.repo.ListPostsByTopic(ctx, topic.Id, sort, viewerID, PageSize+1, (page-1)*PageSize)
	if err != nil {
		return domain.PostPage{}, err
	}

	hasNext := len(rows) > int(PageSize)
	if hasNext {
		rows = rows[:PageSize]
	}
	return domain.PostPage{Items: rows, HasNext: hasNext}, nil
}

// GetPost は投稿を1件返す。検証する入力が無いため、そのまま委譲する。
func (s *BoardService) GetPost(ctx context.Context, postID, viewerID string) (domain.Post, error) {
	return s.repo.GetPost(ctx, postID, viewerID)
}

// CreatePost は投稿を作成する。
//
// タイトルを本文より先に検査する。どちらも不正なときに返る detail が
// 実行ごとに変わらないようにするためである。
func (s *BoardService) CreatePost(ctx context.Context, slug string, user domain.User, title, body string) (domain.Post, error) {
	if n := utf8.RuneCountInString(title); n < minPostTitleChars || n > maxPostTitleChars {
		return domain.Post{}, &domain.InvalidInputError{
			Detail: "タイトルは1文字以上100文字以内にしてください",
		}
	}

	n := utf8.RuneCountInString(body)
	if n < minPostBodyChars || n > maxPostBodyChars {
		return domain.Post{}, &domain.InvalidInputError{
			Detail: "本文は1文字以上15000文字以内にしてください",
		}
	}

	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return domain.Post{}, err
	}

	post, err := s.repo.CreatePost(ctx, topic.Id, user.Id, title, body)
	if err != nil {
		return domain.Post{}, err
	}

	post.AuthorName = user.DisplayName
	post.Topic = topic
	return post, nil
}

func (s *BoardService) Like(ctx context.Context, postID, userID string) error {
	return s.repo.CreateLike(ctx, postID, userID)
}

func (s *BoardService) Unlike(ctx context.Context, postID, userID string) error {
	return s.repo.DeleteLike(ctx, postID, userID)
}

// DeletePost は投稿を削除する。権限の判定はリポジトリが行う。
func (s *BoardService) DeletePost(ctx context.Context, postID, userID string) error {
	return s.repo.DeletePost(ctx, postID, userID)
}
