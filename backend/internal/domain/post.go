package domain

import (
	"time"
)

// Post は本文を含む投稿の詳細情報を表す。
type Post struct {
	Id         string
	AuthorID   string
	Title      string
	Body       string
	AuthorName string
	LikeCount  int32
	LikedByMe  bool
	CreatedAt  time.Time
	Topic      Topic
}

// PostSummary は一覧に並べる投稿を表す。
type PostSummary struct {
	Id          string
	AuthorID    string
	Topic       Topic
	Title       string
	BodyPreview string
	Truncated   bool
	AuthorName  string
	LikeCount   int32
	LikedByMe   bool
	CreatedAt   time.Time
}

// PostPage は投稿一覧の1ページ分を表す。
type PostPage struct {
	Items   []PostSummary
	HasNext bool
}
