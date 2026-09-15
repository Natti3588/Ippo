"use client";

import useSWR from "swr";
import { api, type CurrentUser } from "./api";

/** SWR のキー。ログインとログアウトからも同じ文字列で差せるように外に出す。 */
export const ME_KEY = "/me";

/**
 * ログイン中の利用者を返す。
 *
 * user は3つの状態を持つ。undefined はまだ確かめていない、null は未ログイン、
 * それ以外はログイン中。確認できるまで undefined なのは SWR の既定の振る舞いで、
 * 自分で用意しなくてよくなった。
 *
 * Context を使わないのは、SWR のキャッシュがアプリ全体で1つだから。
 * 同じキーを何か所で呼んでも、通信は1回にまとまる。
 */
export function useAuth() {
  const { data, error, mutate } = useSWR(ME_KEY, () => api.me());

  return {
    // 通信そのものが失敗したときは未ログイン扱いにする。
    // api.me() は 401 を例外にせず null を返すので、ここに来るのは通信断など。
    user: error ? null : data,

    /** ログインと新規登録が成功したら呼ぶ。取り直さずに手元を書き換える。 */
    setUser: (user: CurrentUser | null) => mutate(user, { revalidate: false }),
  };
}
