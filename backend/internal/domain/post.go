package domain

import (
	"time"
)

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
//
// 本文はプレビューしか持たない。一覧は1ページ10件ずつ返すが、
// 全文を載せると1ページでも本文長×10になる。
// 全文が必要なときは GetPost で1件ずつ取る。
type PostSummary struct {
	Id          string
	AuthorID    string
	Title       string
	BodyPreview string
	Truncated   bool
	AuthorName  string
	LikeCount   int32
	LikedByMe   bool
	CreatedAt   time.Time
}

// PostPage は投稿一覧の1ページ分を表す。
//
// 総件数を持たない。件数を出すには COUNT(*) を別に投げることになり、
// 件数と中身が別のクエリになる以上、ズレる瞬間ができる。
// 画面に要るのは「次があるか」だけなので、それだけを持つ。
type PostPage struct {
	Items   []PostSummary
	HasNext bool
}
