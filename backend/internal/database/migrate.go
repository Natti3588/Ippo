package database

import (
	"embed"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// normalizeDSN は接続に必要な設定をコードで強制して返す。
func normalizeDSN(raw string) (*mysql.Config, error) {
	cfg, err := mysql.ParseDSN(raw)
	if err != nil {
		// このエラーには DSN 全体（パスワードを含む）が入りうるため、意図的に包まない
		return nil, ErrInvalidDatabaseDSN
	}

	cfg.ParseTime = true
	cfg.Loc = time.UTC
	cfg.MultiStatements = false

	if cfg.Params == nil {
		cfg.Params = map[string]string{}
	}
	cfg.Params["time_zone"] = "'+00:00'"

	return cfg, nil
}

// migrationURL は golang-migrate に渡す URL を組み立てる。
// ドライバは受け取った DSN の user と password を QueryUnescape するため、
// ここで先にエスケープしておく。記号を含むパスワードで認証が壊れるのを防ぐ。
// multiStatements はドライバ側が有効化するので、ここでは設定しない。
func migrationURL(cfg *mysql.Config) string {
	c := *cfg
	c.User = url.QueryEscape(cfg.User)
	c.Passwd = url.QueryEscape(cfg.Passwd)
	return "mysql://" + c.FormatDSN()
}

// AppDSN はアプリケーションが接続に使う DSN を返す。
func AppDSN(raw string) (string, error) {
	cfg, err := normalizeDSN(raw)
	if err != nil {
		return "", err
	}
	return cfg.FormatDSN(), nil
}

// Migrate は埋め込まれたマイグレーションを適用する。
func Migrate(raw string) error {
	cfg, err := normalizeDSN(raw)
	if err != nil {
		return err
	}

	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("マイグレーションの読み込みに失敗: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, migrationURL(cfg))
	if err != nil {
		// golang-migrate のエラーには DSN が含まれうるため、意図的に包まない
		_ = src.Close()
		return ErrDatabaseMigrationInit
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("マイグレーションの適用に失敗: %w", err)
	}
	return nil
}
