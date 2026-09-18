"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      // 失敗しても手元はログアウト扱いにする。
      // Cookie が残っているかもしれないが、ログイン中の画面のままにするほうが困る。
      setUser(null);
      router.push("/");
    }
  }

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-[680px] items-center justify-between gap-2.5 px-4 md:px-5">
        <Link
          href="/"
          className="text-body font-bold tracking-wide text-ink md:text-subtitle"
        >
          Ippo
        </Link>

        {/* undefined のあいだは何も出さない。
            出してから消すとちらつく */}
        {user === undefined ? null : user ? (
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="hidden min-h-11 items-center px-4 text-ui text-ink-soft md:flex hover:text-ink transition-colors"
            >
              {user.displayName} さん
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden min-h-11 items-center px-4 text-ui text-ink-soft underline underline-offset-4 md:flex hover:text-ink transition-colors"
            >
              ログアウト
            </button>
            <Link
              href="/posts/new"
              className="ml-3 inline-flex min-h-11 items-center gap-2 rounded-ippo bg-accent px-3.5 py-2.5 text-ui font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
            >
              投稿する
              <PencilIcon />
            </Link>
            {/* 図形だけのボタンなので、読み上げ用の名前を必ず付ける */}
            <button
              type="button"
              aria-label="メニュー"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-ippo border border-border-strong text-ink md:hidden hover:bg-accent-soft hover:border-accent transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex min-h-11 items-center px-4 text-ui text-ink-soft hover:text-ink transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-ippo bg-accent px-3.5 py-2.5 text-ui font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
            >
              はじめる
            </Link>
          </div>
        )}
        </div>
      </header>

      {/*
        画面いっぱいに出す。横から滑り込ませない。
        動きを付けるほどの画面ではないし、動かすと閉じ方が分かりにくくなる。
      */}
      {menuOpen && user && (
        <div className="fixed inset-0 z-10 flex flex-col bg-ground md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span className="text-preview font-bold text-ink">Ippo</span>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-ippo border border-border-strong text-ink hover:bg-accent-soft hover:border-accent transition-colors"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="border-b border-border px-4 py-4">
            <p className="text-ui text-ink-soft">ログイン中</p>
            <p className="text-preview font-bold text-ink">{user.displayName} さん</p>
          </div>

          <nav className="flex flex-col">
            <Link
              href="/topics/study-method"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-14 items-center border-b border-border px-4 text-preview text-ink hover:bg-accent-soft transition-colors"
            >
              掲示板
            </Link>
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-14 items-center border-b border-border px-4 text-preview text-ink hover:bg-accent-soft transition-colors"
            >
              設定
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex min-h-14 items-center border-b border-border px-4 text-left text-preview text-ink-soft hover:bg-accent-soft hover:text-ink transition-colors"
            >
              ログアウト
            </button>
          </nav>
        </div>
      )}
    </>
  );
}

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}
