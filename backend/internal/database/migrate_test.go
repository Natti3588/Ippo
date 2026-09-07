package database

import (
	"errors"
	"strings"
	"testing"
)

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
