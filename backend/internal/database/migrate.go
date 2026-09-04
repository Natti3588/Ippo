package database

import (
	"embed"
	"errors"
	"fmt"
	"net/url"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func normalizeDatabaseURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", ErrInvalidDatabaseURL
	}

	switch u.Scheme {
	case "postgres", "postgresql":
		u.Scheme = "pgx5"
	default:
		return "", fmt.Errorf("%w: %q （postgres:// 形式で指定してください）", ErrUnsupportedScheme, u.Scheme)
	}

	return u.String(), nil
}

func Migrate(databaseURL string) error {
	migrationURL, err := normalizeDatabaseURL(databaseURL)
	if err != nil {
		return err
	}

	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("マイグレーションの読み込みに失敗: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, migrationURL)
	if err != nil {
		return fmt.Errorf("マイグレートの初期化に失敗: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("マイグレーションの適用に失敗: %w", err)
	}
	return nil
}
