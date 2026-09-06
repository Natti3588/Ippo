package domain

type SortOrder string

const (
	SortPopular SortOrder = "popular"
	SortNewest  SortOrder = "newest"
	SortOldest  SortOrder = "oldest"
)

type Topic struct {
	Id   string
	Slug string
	Name string
}
