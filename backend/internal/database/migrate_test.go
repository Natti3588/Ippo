package database

import (
	"errors"
	"testing"
)

func TestNormalizedatabaseURL(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    string
		wantErr error
	}{
		{
			name:  "postgresスキームをpgx5に変換する",
			input: "postgres://user:password@localhost:5433/mydb?sslmode=disable",
			want:  "pgx5://user:password@localhost:5433/mydb?sslmode=disable",
		},
		{
			name:  "postgresqlスキームをpgx5に変換する",
			input: "postgresql://user:password@localhost:5433/mydb?sslmode=disable",
			want:  "pgx5://user:password@localhost:5433/mydb?sslmode=disable",
		},
		{
			name:    "pgx5は入り口では受け付けない",
			input:   "pgx5://user:password@localhost:5433/mydb?sslmode=disable",
			wantErr: ErrUnsupportedScheme,
		},
		{
			name:    "別のデータベースのスキームを拒否する",
			input:   "mysql://user:password@localhost:3306/mydb",
			wantErr: ErrUnsupportedScheme,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeDatabaseURL(tt.input)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("エラーが期待と異なる:\n got: %v\nwant: %v", got, tt.wantErr)
				}
				return
			}

			if err != nil {
				t.Fatalf("予期しないエラー: %v", err)
			}
			if got != tt.want {
				t.Errorf("変換結果が異なる:\n got: %s\nwant: %s", got, tt.want)
			}
		})
	}
}
