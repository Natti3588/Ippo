"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, type CurrentUser } from "./api";

type AuthState = {
  /** ログイン中の利用者。未ログインなら null。確認中は undefined */
  user: CurrentUser | null | undefined;
  /** ログイン・新規登録の成功後に呼ぶ。再取得せずに手元の状態を更新する */
  setUser: (user: CurrentUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined = まだ確かめていない。null = 未ログイン。
  // この3つ目の状態が無いと、確認中に「ログイン」ボタンが一瞬出てしまう。
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  return <AuthContext value={{ user, setUser }}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth は AuthProvider の中でしか使えません");
  }
  return ctx;
}
