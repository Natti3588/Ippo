"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, type CurrentUser } from "./api";

type AuthState = {
  /** ログイン中の利用者。未ログインなら null、確認中は undefined */
  user: CurrentUser | null | undefined;
  /** ログインと新規登録が成功したら呼ぶ。取り直さずに手元を書き換える */
  setUser: (user: CurrentUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // undefined はまだ確かめていない状態、null は未ログイン。
  // 2つで済ませると、確かめている最中に「ログイン」ボタンが一瞬出る。
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
