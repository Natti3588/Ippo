import type { components } from "./api-types";

/** 契約で定義した RFC 9457 の Problem Details。 */
export type ProblemDetails = components["schemas"]["ProblemDetails"];

/**
 * API がエラーを返したことを表す。
 *
 * detail には、利用者に見せてよい日本語だけが入る（バックエンドがそう作ってある）。
 * そのまま画面に出してよい。title は HTTP のステータス文（英語）なので出さない。
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * レスポンスから ApiError を作る。
 *
 * 500 は契約に宣言していないので本文を持たない。
 * Problem Details として読めなかった場合も、ここで汎用の文言に倒す。
 * 画面側が「detail が空かもしれない」を毎回考えずに済むようにする。
 */
export async function toApiError(res: Response): Promise<ApiError> {
  const fallback = "通信に失敗しました。しばらくしてからお試しください";

  try {
    const body = (await res.json()) as ProblemDetails;
    const detail = body.detail?.trim();
    return new ApiError(res.status, detail ? detail : fallback);
  } catch {
    return new ApiError(res.status, fallback);
  }
}
