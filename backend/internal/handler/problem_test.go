package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Natti3588/Ippo/backend/internal/api"
)

func TestWriteInternalServerError(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	rec := httptest.NewRecorder()

	writeInternalServerError(context.Background(), rec, logger)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("HTTP Status = %d, want = %d", rec.Code, http.StatusInternalServerError)
	}
	if rec.Header().Get("Content-Type") != "application/problem+json" {
		t.Errorf("Content-Type = %q, want = %q", rec.Header().Get("Content-Type"), "application/problem+json")
	}

	var got api.ProblemDetails
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("リクエストを解釈できません: %v", err)
	}

	if got.Type != "about:blank" {
		t.Errorf("got.Type = %q, want = %q", got.Type, "about:blank")
	}
	if got.Status != http.StatusInternalServerError {
		t.Errorf("got.Status = %d, want = %d", got.Status, http.StatusInternalServerError)
	}
	if got.Title != "Internal Server Error" {
		t.Errorf("got.Title = %q, want = %q", got.Title, "Internal Server Error")
	}
	if got.Detail != "サーバー内部でエラーが発生したため、処理を完了できませんでした。" {
		t.Errorf("got.Detail = %q, want = %q", got.Detail, "サーバー内部でエラーが発生したため、処理を完了できませんでした。")
	}
}
