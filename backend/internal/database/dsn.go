package database

import (
	"fmt"
	"os"
	"strings"
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
