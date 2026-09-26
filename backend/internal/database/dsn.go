package database

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
)

// DSNFromEnv は MySQLのDSNを環境変数から得る
//
// DATABASE_URL があればそのまま返す。
// ローカルのdocker-composeはこの経路を使う。
//
// 無ければ5つの環境変数から組み立てる。
// ECSのタスク定義は Secrets Managerの値を環境変数に入れるが、
// 他の値をつないで1本の文字列にすることはできない。
func DSNFromEnv() (string, error) {
	if raw := os.Getenv("DATABASE_URL"); raw != "" {
		return raw, nil
	}

	var missing []string
	get := func(key string) string {
		v := os.Getenv(key)
		if v == "" {
			missing = append(missing, key)
		}
		return v
	}

	user := get("DB_USER")
	pass := get("DB_PASSWORD")
	host := get("DB_HOST")
	port := get("DB_PORT")
	name := get("DB_NAME")

	if len(missing) > 0 {
		return "", fmt.Errorf("%w: %s", ErrMissingDatabaseEnv, strings.Join(missing, ", "))
	}

	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", user, pass, host, port, name), nil
}

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

// AppDSN はアプリケーションが接続に使う DSN を返す。
func AppDSN(raw string) (string, error) {
	cfg, err := normalizeDSN(raw)
	if err != nil {
		return "", err
	}
	return cfg.FormatDSN(), nil
}
