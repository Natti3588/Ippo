import type { components, paths } from "./api-types";
import { toApiError } from "./problem";

// 絶対 URL にしない。開発では Next.js の rewrites、本番ではロードバランサがバックエンドへ振り分ける
const BASE = "/api";

// すべての呼び出しがここを通る。credentials を 1 か所で付けるので、画面ごとの付け忘れが起きない
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

  // 204 は本文がないので json() を呼べない
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

type Schemas = components["schemas"];

export type Topic = Schemas["Topic"];
export type PostPage = Schemas["PostPage"];
export type PostSummary = Schemas["PostSummary"];
export type Post = Schemas["Post"];
export type CurrentUser = Schemas["CurrentUser"];
export type UploadTicket = Schemas["UploadTicket"];
// 並び順はスキーマに名前がないので、一覧の API のクエリから取り出す
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

  // ログイン中の利用者を返す。未ログインは異常ではないので、401 は例外にせず null を返す
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

  posts: (slug: string, sort: SortOrder = "popular", page = 1) =>
    request<PostPage>(
      `/topics/${encodeURIComponent(slug)}/posts?sort=${sort}&page=${page}`,
    ),

  // すべてのトピックの投稿
  allPosts: (sort: SortOrder = "popular", page = 1) =>
    request<PostPage>(`/posts?sort=${sort}&page=${page}`),

  post: (postId: string) => request<Post>(`/posts/${encodeURIComponent(postId)}`),

  createPost: (slug: string, title: string, body: string) =>
    request<Post>(`/topics/${encodeURIComponent(slug)}/posts`, {
      method: "POST",
      body: JSON.stringify({ title, body }),
    }),

  updatePost: (postId: string, title: string, body: string) =>
    request<Post>(`/posts/${encodeURIComponent(postId)}`, {
      method: "PUT",
      body: JSON.stringify({ title, body }),
    }),

  deletePost: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}`, { method: "DELETE" }),

  like: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}/like`, { method: "PUT" }),

  unlike: (postId: string) =>
    request<void>(`/posts/${encodeURIComponent(postId)}/like`, { method: "DELETE" }),

  // --- 画像 ---

  // 画像を 1 枚送るための許可をもらう。画像そのものは S3 へ直接送る
  createUpload: () => request<UploadTicket>("/uploads", { method: "POST" }),
};
