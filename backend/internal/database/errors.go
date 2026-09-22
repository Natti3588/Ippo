package database

import "errors"

var (
	// ErrInvalidDatabaseDSNは接続DSNの形式が不正なことを表す。
	ErrInvalidDatabaseDSN = errors.New("データベースDSNの形式が不正です")

	// ErrDatabaseMigrationInit はマイグレーション実行を初期化できなかったことを表す。
	ErrDatabaseMigrationInit = errors.New("マイグレートの初期化に失敗しました")

	// ErrMissingDatabaseEnv はDB接続に必要な環境変数が足りないことを表す。
	ErrMissingDatabaseEnv = errors.New("接続に必要な環境変数が不足しています")
)
