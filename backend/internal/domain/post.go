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
// 本文はプレビューしか持たない。一覧はページングを持たず全件返すため、
// 全文を載せると投稿数×本文長でレスポンスが膨らむ。
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
