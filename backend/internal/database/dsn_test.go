package database

import (
	"errors"
	"strings"
	"testing"
)

func TestDSNFromEnv(t *testing.T) {
	// 環境変数
	keys := []string{
		"DATABASE_URL",
		"DB_USER",
		"DB_PASSWORD",
		"DB_HOST",
		"DB_PORT",
		"DB_NAME",
	}

	tests := []struct {
		name        string
		env         map[string]string
		want        string
		wantErr     error
		wantMissing []string
	}{
		{
			name: "DATABASE_URLがあればそれを使う",
			env: map[string]string{
				"DATABASE_URL": "u:p@tcp(h:3306)/d?parseTime=true",
			},
			want: "u:p@tcp(h:3306)/d?parseTime=true",
		},
		{
			name: "DATABASE_URLがなければ5つから組み立てる",
			env: map[string]string{
				"DB_USER":     "admin",
				"DB_PASSWORD": "s3cret",
				"DB_HOST":     "db.example.com",
				"DB_PORT":     "3306",
				"DB_NAME":     "ippo",
			},
			want: "admin:s3cret@tcp(db.example.com:3306)/ippo",
		},
		{
			name: "記号を含むパスワードがそのまま入る",
			env: map[string]string{
				"DB_USER":     "admin",
				"DB_PASSWORD": "a@b:c/d",
				"DB_HOST":     "h",
				"DB_PORT":     "3306",
				"DB_NAME":     "ippo",
			},
			want: "admin:a@b:c/d@tcp(h:3306)/ippo",
		},
		{
			name:        "どちらも無ければエラー",
			env:         map[string]string{},
			wantErr:     ErrMissingDatabaseEnv,
			wantMissing: []string{"DB_USER", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME"},
		},
		{
			name: "5つのうち一部が欠けたらエラー",
			env: map[string]string{
				"DB_USER":     "admin",
				"DB_PASSWORD": "s3cret",
				"DB_HOST":     "h",
			},
			wantErr:     ErrMissingDatabaseEnv,
			wantMissing: []string{"DB_PORT", "DB_NAME"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for _, k := range keys {
				t.Setenv(k, "")
			}
			for k, v := range tt.env {
				t.Setenv(k, v)
			}

			got, err := DSNFromEnv()

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("エラーが期待と異なる :\n got: %v\nwant: %v", err, tt.wantErr)
				}

				for _, name := range tt.wantMissing {
					if !strings.Contains(err.Error(), name) {
						t.Errorf("エラーメッセージに %q が無い: %v", name, err)
					}
				}

				if pw := tt.env["DB_PASSWORD"]; pw != "" && strings.Contains(err.Error(), pw) {
					t.Errorf("エラーメッセージにパスワードが含まれている")
				}
				return
			}

			if err != nil {
				t.Fatalf("予期しないエラー: %v", err)
			}
			if got != tt.want {
				t.Errorf("DSN = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestAppDSN(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		wantHave    []string
		wantNotHave []string
		wantErr     error
	}{
		{
			name:        "書かなくても parseTime と loc は UTCになる",
			input:       "user:pass@tcp(localhost:3307)/mydb",
			wantHave:    []string{"parseTime=true"},
			wantNotHave: []string{"loc="},
		},
		{
			name:        "loc を指定しても UTC に上書きされる",
			input:       "user:pass@tcp(locallhost:3307)/mydb?loc=Local",
			wantNotHave: []string{"loc="},
		},
		{
			name:     "parseTime=false は上書きされる",
			input:    "user:pass@tcp(localhost:3307)/mydb?parseTime=false",
			wantHave: []string{"parseTime=true"},
		},
		{
			name:        "multiStatements は無効にされる",
			input:       "user:pass@tcp(localhost:3307)/mydb?multiStatements=true",
			wantNotHave: []string{"multiStatements=true"},
		},
		{
			name:    "壊れた DSN は解析に失敗する",
			input:   "user:pass@tcp(localhost:3307)/mydb?parseTime=maybe",
			wantErr: ErrInvalidDatabaseDSN,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dsn, err := AppDSN(tt.input)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("エラーが期待と異なる:\n got: %v\nwant: %v", err, tt.wantErr)
				}
				return
			}

			if err != nil {
				t.Fatalf("予期しないエラー: %v", err)
			}

			for _, s := range tt.wantHave {
				if !strings.Contains(dsn, s) {
					t.Errorf("DSNに %q が無い: %s", s, dsn)
				}
			}
			for _, s := range tt.wantNotHave {
				if strings.Contains(dsn, s) {
					t.Errorf("DSNに %q が含まれている: %s", s, dsn)
				}
			}
		})
	}
}
