package domain

import (
	"time"
)

type Post struct {
	Id         string
	Body       string
	AuthorName string
	LikeCount  int32
	CreatedAt  time.Time
}
