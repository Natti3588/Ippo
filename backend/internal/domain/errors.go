package domain

import "errors"

var (
	// ErrNotFoundは対象が存在しないことを表す
	ErrNotFound = errors.New("not found")

	// ErrEmailTakenは既に使われているメールアドレスで登録しようとしたことを表す
	ErrEmailTaken = errors.New("email already taken")
)
