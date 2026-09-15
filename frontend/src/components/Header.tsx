"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      // 失敗しても手元はログアウト扱いにする。
      // Cookie が消えていない可能性は残るが、画面に残り続けるほうが困る。
      setUser(null);
      router.push("/");
    }
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-18 max-w-[840px] items-center justify-between gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="text-[21px] font-bold tracking-wide text-ink md:text-[23px]"
        >
          Ippo
        </Link>

        {/* user が undefined のあいだは何も出さない。
            出してから消すと、画面がちらつく */}
        {user === undefined ? null : user ? (
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              className="hidden min-h-12 items-center px-4 text-[17px] text-ink-soft md:flex"
            >
              {user.displayName} さん
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden min-h-12 items-center px-4 text-[17px] text-ink-soft underline underline-offset-4 md:flex"
            >
              ログアウト
            </button>
            <Link
              href="/posts/new"
              className="ml-3 inline-flex min-h-12 items-center gap-2.5 rounded-ippo bg-accent px-5 py-3.5 text-[17px] font-bold text-surface"
            >
              投稿する
              <PencilIcon />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="flex min-h-12 items-center px-4 text-[17px] text-ink-soft"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-5 py-3.5 text-[17px] font-bold text-surface"
            >
              はじめる
            </Link>
          </div>
        )}
      </div>
    </header>
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
