package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Natti3588/Ippo/backend/internal/api"
)

func TestRecoverReturnsProblemOnPanic(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	rec := httptest.NewRecorder()

	req := httptest.NewRequest(http.MethodGet, "/", nil)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	})

	Recover(logger)(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Errorf("Status = %d, want = %d", rec.Code, http.StatusInternalServerError)
	}
	if rec.Header().Get("Content-Type") != "application/problem+json" {
		t.Errorf("Content-Type = %q, want %q", rec.Header().Get("Content-Type"), "application/problem+json")
	}

	var got api.ProblemDetails
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatalf("リクエストを解釈できません: %v", err)
	}

	if got.Detail != "サーバー内部でエラーが発生したため、処理を完了できませんでした。" {
		t.Errorf("Detail = %q, want = %q", got.Detail, "サーバー内部でエラーが発生したため、処理を完了できませんでした。")
	}
}

func TestRecoverPassesThroughWithoutPanic(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	rec := httptest.NewRecorder()

	req := httptest.NewRequest(http.MethodGet, "/", nil)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("ok"))
	})

	Recover(logger)(next).ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("Status = %d, want = %d", rec.Code, http.StatusCreated)
	}
	if got := rec.Body.String(); got != "ok" {
		t.Errorf("Body = %q, want = %q", got, "ok")
	}
}

func TestRecoverRepanicsErrAbortHandler(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	rec := httptest.NewRecorder()

	req := httptest.NewRequest(http.MethodGet, "/", nil)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic(http.ErrAbortHandler)
	})

	defer func() {
		if v := recover(); v != http.ErrAbortHandler {
			t.Errorf("panic = %v, want = %v", v, http.ErrAbortHandler)
		}
		if got := rec.Body.String(); got != "" {
			t.Errorf("Body = %q, want = %q", got, "")
		}
	}()

	Recover(logger)(next).ServeHTTP(rec, req)
}

func TestRecoverAbortsWhenResponseStarted(t *testing.T) {
	logger := slog.New(slog.DiscardHandler)
	rec := httptest.NewRecorder()

	req := httptest.NewRequest(http.MethodGet, "/", nil)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("partial"))
		panic("boom")
	})

	defer func() {
		if v := recover(); v != http.ErrAbortHandler {
			t.Errorf("panic = %v, want = %v", v, http.ErrAbortHandler)
		}
		if got := rec.Body.String(); got != "partial" {
			t.Errorf("Body = %q, want = %q", got, "partial")
		}
	}()

	Recover(logger)(next).ServeHTTP(rec, req)
}
