package service

import (
	"context"
	"unicode/utf8"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type BoardRepository interface {
	ListTopics(ctx context.Context) ([]domain.Topic, error)
	GetTopic(ctx context.Context, slug string) (domain.Topic, error)
	ListPostsByTopic(ctx context.Context, topicID string, sort domain.SortOrder) ([]domain.Post, error)
	CreatePost(ctx context.Context, topicID, authorID, body string) (domain.Post, error)
	CreateLike(ctx context.Context, postID, authorID string) error
	DeleteLike(ctx context.Context, postID, authorID string) error
}

// 本文の長さは文字で数える。DB の chk_posts_body が CHAR_LENGTH() だからである。
const (
	minPostBodyChars = 1
	maxPostBodyChars = 1000
)

type BoardService struct {
	repo BoardRepository
}

func NewBoardService(repo BoardRepository) *BoardService {
	return &BoardService{repo: repo}
}

func (s *BoardService) ListTopics(ctx context.Context) ([]domain.Topic, error) {
	return s.repo.ListTopics(ctx)
}

func (s *BoardService) ListPosts(ctx context.Context, slug string, sort domain.SortOrder) ([]domain.Post, error) {
	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return nil, err
	}

	return s.repo.ListPostsByTopic(ctx, topic.Id, sort)
}

// CreatePost は投稿を作成する。
func (s *BoardService) CreatePost(ctx context.Context, slug string, user domain.User, body string) (domain.Post, error) {
	n := utf8.RuneCountInString(body)
	if n < minPostBodyChars || n > maxPostBodyChars {
		return domain.Post{}, &domain.InvalidInputError{
			Detail: "本文は1文字以上1000文字以内にしてください",
		}
	}

	topic, err := s.repo.GetTopic(ctx, slug)
	if err != nil {
		return domain.Post{}, err
	}

	post, err := s.repo.CreatePost(ctx, topic.Id, user.Id, body)
	if err != nil {
		return domain.Post{}, err
	}

	post.AuthorName = user.DisplayName
	return post, nil
}

func (s *BoardService) Like(ctx context.Context, postID, userID string) error {
	return s.repo.CreateLike(ctx, postID, userID)
}

func (s *BoardService) Unlike(ctx context.Context, postID, userID string) error {
	return s.repo.DeleteLike(ctx, postID, userID)
}
