import type { paths } from "./api-types";
import { toApiError } from "./problem";

/**
 * API のベースパス。
 *
 * 絶対 URL は書かない。開発では Next.js の rewrites、本番ではロードバランサが
 * バックエンドへ振り分ける。環境変数にしないのは、設定を間違えた環境が
 * よそのオリジンを叩いてしまうのを避けたいから。
 */
const BASE = "/api";

/**
 * API を1回呼ぶ。すべての呼び出しがここを通る。
 *
 * 肝は credentials: "include" を1か所にまとめたこと。
 * 付け忘れても型は通るので、動かして初めて 401 で気づくことになる。
 * 画面ごとに書いていたら、1か所忘れただけで「なぜかログアウトする」が起きる。
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw await toApiError(res);
  }

  // 204 は本文を持たない。json() を呼ぶと落ちる。
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/** 契約の型を短く書くための別名。 */
type Json<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer R } } };
}
  ? R
  : paths[P][M] extends { responses: { 201: { content: { "application/json": infer R } } } }
    ? R
    : never;

export type Topic = Json<"/topics", "get">[number];
export type PostSummary = Json<"/topics/{slug}/posts", "get">[number];
export type Post = Json<"/posts/{postId}", "get">;
export type CurrentUser = Json<"/me", "get">;
export type SortOrder = NonNullable<
  paths["/topics/{slug}/posts"]["get"]["parameters"]["query"]
>["sort"];

export const api = {
  // --- 認証 ---

  signup: (email: string, password: string, displayName: string) =>
    request<CurrentUser>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request<CurrentUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>("/auth/logout", { method: "POST" }),

  /**
   * ログイン中の利用者を返す。未ログインなら null。
   *
   * Cookie は HttpOnly なので JavaScript からは読めない。
   * つまり「ログインしているか」は、ここを呼ばないと分からない。
   * 401 を例外にしないのは、未ログインが異常ではないから。
   */
  me: async (): Promise<CurrentUser | null> => {
    try {
      return await request<CurrentUser>("/me");
    } catch (e) {
      if (e instanceof Error && "status" in e && e.status === 401) {
        return null;
      }
      throw e;
    }
  },

  updateDisplayName: (displayName: string) =>
    request<CurrentUser>("/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    }),

  // --- 掲示板 ---

  topics: () => request<Topic[]>("/topics"),

  posts: (slug: string, sort: SortOrder = "popular") =>
    request<PostSummary[]>(`/topics/${encodeURIComponent(slug)}/posts?sort=${sort}`),

  post: (postId: string) => request<Post>(`/posts/${encodeURIComponent(postId)}`),

  createPost: (slug: string, title: string, body: string) =>
    request<Post>(`/topics/${encodeURIComponent(slug)}/posts`, {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }),

  deletePost: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}`, { method: "DELETE" }),

  like: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}/like`, { method: "PUT" }),

  unlike: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}/like`, { method: "DELETE" }),
};
