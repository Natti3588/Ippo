package service

import (
	"context"
	"unicode/utf8"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository interface {
	ListTopics(ctx context.Context) ([]domain.Topic, error)
	ListPosts(ctx context.Context, sort domain.SortOrder, viewerID string, limit, offset int32) ([]domain.PostSummary, error)
	GetTopic(ctx context.Context, slug string) (domain.Topic, error)
	GetPost(ctx context.Context, postID, viewerID string) (domain.Post, error)
	ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder, viewerID string, limit, offset int32) ([]domain.PostSummary, error)
	CreatePost(ctx context.Context, topicID, authorID, title, body string) (domain.Post, error)
	CreateLike(ctx context.Context, postID, authorID string) error
	DeleteLike(ctx context.Context, postID, authorID string) error
	DeletePost(ctx context.Context, postID, authorID string) error
}

// 長さは文字数で数える（DB の CHECK 制約が CHAR_LENGTH() のため）。
// 本文上限 15000 は utf8mb4 × 4バイトで TEXT(65,535バイト) に収まる値。
const (
	minPostBodyChars  = 1
	maxPostBodyChars  = 15000
	minPostTitleChars = 1
	maxPostTitleChars = 100
)

type BoardService struct {
	repo BoardRepository
}

// PageSize は一覧1ページの件数。
const PageSize int32 = 10

func NewBoardService(repo BoardRepository) *BoardService {
	return &BoardService{repo: repo}
}

// ListTopics はトピック一覧を返す。
func (s *BoardService) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return s.repo.ListTopics(ctx)
}

// ListPostsByTopic は投稿一覧をトピックで絞り返す。
func (s *BoardService) ListPostsByTopic(ctx context.Context, slug string, sort domain.SortOrder, viewerID string, page int32) (domain.PostPage, error) {
	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return domain.PostPage{}, err
	}

	rows, err := s.repo.ListPostsByTopic(ctx, topic.Id, sort, viewerID, PageSize+1, (page-1)*PageSize)
	if err != nil {
		return domain.PostPage{}, err
	}
	for i := range rows {
		rows[i].Topic = topic
	}

	hasNext := len(rows) > int(PageSize)
	if hasNext {
		rows = rows[:PageSize]
	}
	return domain.PostPage{Items: rows, HasNext: hasNext}, nil
}

// ListPosts は投稿一覧をトピックで絞らずに返す。
func (s *BoardService) ListPosts(ctx context.Context, sort domain.SortOrder, viewerID string, page int32) (domain.PostPage, error) {
	rows, err := s.repo.ListPosts(ctx, sort, viewerID, PageSize+1, (page-1)*PageSize)
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

// Like は指定の投稿のいいねを追加する。
func (s *BoardService) Like(ctx context.Context, postID, userID string) error {
	return s.repo.CreateLike(ctx, postID, userID)
}

// Unlike は指定の投稿のいいねを削除する。
func (s *BoardService) Unlike(ctx context.Context, postID, userID string) error {
	return s.repo.DeleteLike(ctx, postID, userID)
}

// DeletePost は投稿を削除する。権限の判定はリポジトリが行う。
func (s *BoardService) DeletePost(ctx context.Context, postID, userID string) error {
	return s.repo.DeletePost(ctx, postID, userID)
}
