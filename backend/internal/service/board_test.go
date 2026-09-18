package service

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"testing"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type pagingBoardRepository struct {
	BoardRepository
	posts  []domain.PostSummary
	limit  int32
	offset int32
}

func (r *pagingBoardRepository) GetTopic(_ context.Context, _ string) (domain.Topic, error) {
	return domain.Topic{Id: "topic-id"}, nil
}

func (r *pagingBoardRepository) ListPostsByTopic(_ context.Context, _ string, _ domain.SortOrder, _ string, limit, offset int32) ([]domain.PostSummary, error) {
	r.limit = limit
	r.offset = offset
	return r.posts, nil
}

func TestListPostsPaging(t *testing.T) {
	tests := []struct {
		name        string
		rows        int
		page        int32
		wantItems   int
		wantHasNext bool
		wantOffset  int32
	}{
		{"11件返れば次がある", 11, 1, 10, true, 0},
		{"10件ちょうどなら次は無い", 10, 1, 10, false, 0},
		{"10件に満たない", 9, 1, 9, false, 0},
		{"1件も無い", 0, 1, 0, false, 0},
		{"3ページ目は20件飛ばす", 11, 3, 10, true, 20},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			posts := make([]domain.PostSummary, tt.rows)
			for i := range posts {
				posts[i].Id = strconv.Itoa(i)
			}
			repo := &pagingBoardRepository{posts: posts}

			got, err := NewBoardService(repo).ListPosts(
				context.Background(), "study-method", domain.SortPopular, "", tt.page,
			)
			if err != nil {
				t.Fatalf("ListPosts が失敗した: %v", err)
			}

			if len(got.Items) != tt.wantItems {
				t.Errorf("件数 = %d, want %d", len(got.Items), tt.wantItems)
			}
			if got.HasNext != tt.wantHasNext {
				t.Errorf("HasNext = %v, want %v", got.HasNext, tt.wantHasNext)
			}
			if repo.offset != tt.wantOffset {
				t.Errorf("OFFSET = %d, want %d", repo.offset, tt.wantOffset)
			}
			if repo.limit != PageSize+1 {
				t.Errorf("LIMIT = %d, want %d（1件多く取る）", repo.limit, PageSize+1)
			}
			if n := len(got.Items); n > 0 && got.Items[n-1].Id != strconv.Itoa(n-1) {
				t.Errorf("最後の要素の Id = %q, want %q", got.Items[n-1].Id, strconv.Itoa(n-1))
			}
		})
	}
}

type missingTopicRepository struct {
	BoardRepository
}

func (r *missingTopicRepository) GetTopic(_ context.Context, _ string) (domain.Topic, error) {
	return domain.Topic{}, domain.ErrNotFound
}

func TestListPostsPropagatesNotFound(t *testing.T) {
	_, err := NewBoardService(&missingTopicRepository{}).ListPosts(
		context.Background(), "no-such-topic", domain.SortPopular, "", 1,
	)
	if !errors.Is(err, domain.ErrNotFound) {
		t.Fatalf("err = %v, want domain.ErrNotFound", err)
	}
}

type createPostRepository struct {
	BoardRepository
	created bool
}

func (r *createPostRepository) GetTopic(_ context.Context, _ string) (domain.Topic, error) {
	return domain.Topic{Id: "topic-id", Slug: "study-method", Name: "効率的な勉強法"}, nil
}

func (r *createPostRepository) CreatePost(_ context.Context, _, _, title, body string) (domain.Post, error) {
	r.created = true
	return domain.Post{Id: "post-id", Title: title, Body: body}, nil
}

// 利用者にそのまま見せる文言。実装と1文字でも違えば落ちる。
const (
	titleDetail = "タイトルは1文字以上100文字以内にしてください"
	bodyDetail  = "本文は1文字以上15000文字以内にしてください"
)

func TestCreatePostValidation(t *testing.T) {
	tests := []struct {
		name       string
		title      string
		body       string
		wantDetail string
	}{
		{"最短", "あ", "い", ""},
		{"タイトルが上限ちょうど", strings.Repeat("あ", 100), "本文", ""},
		{"本文が上限ちょうど", "題", strings.Repeat("あ", 15000), ""},
		{"タイトルが空", "", "本文", titleDetail},
		{"タイトルが1文字超過", strings.Repeat("あ", 101), "本文", titleDetail},
		{"本文が空", "題", "", bodyDetail},
		{"本文が1文字超過", "題", strings.Repeat("あ", 15001), bodyDetail},
		// 両方不正なときの検査順序を確かめる。
		{"両方不正ならタイトルの側を返す", "", "", titleDetail},
		// 1コードポイントが複数バイトの文字でも、文字数で判定する。
		{"絵文字100個のタイトルは通る", strings.Repeat("👨", 100), "本文", ""},
		{"絵文字101個のタイトルは弾く", strings.Repeat("👨", 101), "本文", titleDetail},
	}

	user := domain.User{Id: "user-id", DisplayName: "みどり"}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &createPostRepository{}

			_, err := NewBoardService(repo).CreatePost(
				context.Background(), "study-method", user, tt.title, tt.body,
			)

			if tt.wantDetail == "" {
				if err != nil {
					t.Fatalf("成功するはずが失敗した: %v", err)
				}
				return
			}

			// エラーの種類に加え、利用者へ返す Detail も確認する。
			var invalid *domain.InvalidInputError
			if !errors.As(err, &invalid) {
				t.Fatalf("err = %v, want *domain.InvalidInputError", err)
			}
			if invalid.Detail != tt.wantDetail {
				t.Errorf("Detail = %q, want %q", invalid.Detail, tt.wantDetail)
			}
			// 入力で弾いたら投稿を保存しない。
			if repo.created {
				t.Error("検証で弾いたのに CreatePost を呼んでいる")
			}
		})
	}
}

// リポジトリが返さない投稿者名とトピックを、サービスが補うことを確かめる。
func TestCreatePostFillsAuthorAndTopic(t *testing.T) {
	repo := &createPostRepository{}
	user := domain.User{Id: "user-id", DisplayName: "みどり"}

	post, err := NewBoardService(repo).CreatePost(
		context.Background(), "study-method", user, "はじめまして", "よろしくお願いします",
	)
	if err != nil {
		t.Fatalf("CreatePost が失敗した: %v", err)
	}

	if post.AuthorName != "みどり" {
		t.Errorf("AuthorName = %q, want %q", post.AuthorName, "みどり")
	}
	if post.Topic.Slug != "study-method" {
		t.Errorf("Topic.Slug = %q, want %q", post.Topic.Slug, "study-method")
	}
	if post.Topic.Name != "効率的な勉強法" {
		t.Errorf("Topic.Name = %q, want %q", post.Topic.Name, "効率的な勉強法")
	}
}
