package domain

import "errors"

// ErrNotFoundは対象が存在しないことを表す
var ErrNotFound = errors.New("not found")
