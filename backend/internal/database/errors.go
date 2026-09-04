package database

import "errors"

var (
	// ErrInvalidDatabaseURLは接続URLの形式が不正なことを表す
	ErrInvalidDatabaseURL = errors.New("データベースURLの形式が不正です")

	// ErrUnsupportedSchemeは接続URLのスキームが対応していないことを表す
	ErrUnsupportedScheme = errors.New("対応していないスキームです")
)
