package domain

import "errors"

var (
	// ErrNotFoundは対象が存在しないことを表す
	ErrNotFound = errors.New("not found")

	// ErrEmailTakenは既に使われているメールアドレスで登録しようとしたことを表す
	ErrEmailTaken = errors.New("email already taken")

	// ErrInvalidCredentialsはメールアドレスとパスワードの組が一致しないことを表す
	ErrInvalidCredentials = errors.New("invalid credentials")

	// ErrInvalidInputは入力が要件を満たしていないことを表す
	ErrInvalidInput = errors.New("invalid input")
)
