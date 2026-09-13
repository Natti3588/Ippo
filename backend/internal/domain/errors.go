package domain

import "errors"

var (
	// ErrNotFoundは対象が存在しないことを表す
	ErrNotFound = errors.New("not found")

	// ErrForbiddenは操作する権限が無いことを表す
	ErrForbidden = errors.New("forbidden")

	// ErrEmailTakenは既に使われているメールアドレスで登録しようとしたことを表す
	ErrEmailTaken = errors.New("email already taken")

	// ErrInvalidCredentialsはメールアドレスとパスワードの組が一致しないことを表す
	ErrInvalidCredentials = errors.New("invalid credentials")

	// ErrInvalidInputは入力が要件を満たしていないことを表す
	ErrInvalidInput = errors.New("invalid input")
)

// InvalidInputError は入力の不備を、利用者に見せてよい説明つきで表す。
//
// Detail に入れてよいのは、そのまま利用者に返して差し支えない日本語だけである。
// 内部の識別子、SQL、ファイルパス、ラップされたエラーの文言を入れないこと。
type InvalidInputError struct {
	Detail string
}

func (e *InvalidInputError) Error() string { return e.Detail }

// Is は errors.Is(err, ErrInvalidInput) を真にする。
// これにより、種類だけを見たい呼び出し側は従来どおりセンチネルで判定できる。
func (e *InvalidInputError) Is(target error) bool { return target == ErrInvalidInput }
