package database

import (
	"embed"
	"errors"
	"fmt"
	"net/url"

	"github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// migrationURL は golang-migrate用の URL を返す。
// ドライバーが user / password を QueryUnEscape するため、事前にエスケープする。
func migrationURL(cfg *mysql.Config) string {
	c := *cfg
	c.User = url.QueryEscape(cfg.User)
	c.Passwd = url.QueryEscape(cfg.Passwd)
	return "mysql://" + c.FormatDSN()
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
