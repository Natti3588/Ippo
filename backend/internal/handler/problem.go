package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"

	"github.com/Natti3588/Ippo/backend/internal/api"
)

// writeProblem は RFC 9457 の Problem Details を書き出す。
//
// detail に渡してよいのは、利用者に見せて差し支えない説明だけである。
// err.Error() をそのまま渡してはならない。内部の文言やラップされた情報が外に出る。
//
// 500 はこの関数を使わない。契約に 500 を宣言していないため、本文を持たせない。
func writeProblem(ctx context.Context, w http.ResponseWriter, logger *slog.Logger, status int, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)

	body := api.ProblemDetails{
		Type:   "about:blank",
		Title:  http.StatusText(status),
		Status: int32(status),
		Detail: detail,
	}
	if err := json.NewEncoder(w).Encode(body); err != nil {
		logger.ErrorContext(ctx, "エラーレスポンスの書き込みに失敗", "error", err)
	}
}

// ParamErrorHandler は、生成コードがクエリやパスの引数を解釈できなかったときの応答を返す。
func ParamErrorHandler(logger *slog.Logger) func(w http.ResponseWriter, r *http.Request, err error) {
	return func(w http.ResponseWriter, r *http.Request, err error) {
		logger.InfoContext(r.Context(), "リクエストを解釈できません", "error", err)

		detail := "リクエストの形式が不正です"
		if formatErr, ok := errors.AsType[*api.InvalidParamFormatError](err); ok {
			detail = formatErr.ParamName + " の形式が不正です"
		}
		writeProblem(r.Context(), w, logger, http.StatusBadRequest, detail)
	}
}
