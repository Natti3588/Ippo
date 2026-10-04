"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BOARD_HREF } from "@/lib/topics";

export function Header() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(pathname);
  // 広い画面の小さなメニュー用。ボタンとメニューの外を押したかどうかの判定に使う
  const dropdownRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 別のページへ移ったら閉じる。effect で setState せず、描画中に前回の値と比べる。
  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  // 開いているあいだだけ、外を押す・Escape を見張る。
  // スマホの全画面メニューの中を押したときは閉じない。閉じると、押した項目に click が届かない。
  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target) || overlayRef.current?.contains(target)) return;
      setMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  /*
    掲示板にいるときだけ、いま見ているトピックを投稿画面へ渡す。

    投稿画面は ?topic= を読んで、そのトピックを選んだ状態で開き、
    「やめる」の戻り先にも使う。渡さないと、さっきまで読んでいた
    トピックをもう一度選び直させたうえ、やめたときに別のトピックへ送ることになる。

    slug が配列になるのは catch-all の経路のときで、このアプリには無い。
    それでも型は string | string[] なので、文字列のときだけ使う。
  */
  const routeParams = useParams();
  const currentSlug =
    typeof routeParams?.slug === "string" ? routeParams.slug : null;
  const newPostHref = currentSlug
    ? `/posts/new?topic=${encodeURIComponent(currentSlug)}`
    : "/posts/new";

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
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="text-body font-bold tracking-wide text-ink md:text-subtitle"
          >
            Ippo
          </Link>

          {/*
            掲示板はこのアプリの本体なので、口座まわりの操作（設定・ログアウト）
            とは反対側、ロゴの隣に置く。

            狭い画面では、ログイン中は出さない。ロゴ・投稿する・メニューで
            既に埋まっていて、4つ目を入れると折り返す。開く全画面のメニューの中に同じ行がある。

            未ログインのときはメニューが無いので、そのまま出す。
            登録の前に中を見せるための入口になる。未ログインでも投稿は全部読める。
          */}
          <Link
            href={BOARD_HREF}
            className={`min-h-11 items-center px-3 text-ui text-ink-soft md:flex hover:text-ink transition-colors ${
              user === null ? "flex" : "hidden"
            }`}
          >
            掲示板
          </Link>
        </div>

        {/* undefined のあいだは何も出さない。
            出してから消すとちらつく */}
        {user === undefined ? null : user ? (
          <div className="flex items-center gap-1">
            <Link
              href={newPostHref}
              className="ml-3 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-ippo bg-accent px-3.5 py-2.5 text-ui font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
            >
              投稿する
              <PencilIcon />
            </Link>
            {/*
              広い画面では、全画面ではなくボタンの下に小さく開く。
              3項目のために画面全体を覆うと、余白ばかりになる。

              role="menu" にしない。menu は矢印キーで項目を移る操作まで求める。
              中身は普通のリンクとボタンなので、Tab で順に移れれば足りる。
            */}
            <div ref={dropdownRef} className="relative">
              {/* 図形だけのボタンなので、読み上げ用の名前を必ず付ける */}
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="メニュー"
                aria-expanded={menuOpen}
                aria-controls="header-menu"
                onClick={() => setMenuOpen((open) => !open)}
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
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  id="header-menu"
                  className="absolute right-0 top-full z-10 mt-2 hidden w-60 rounded-ippo border border-border bg-surface shadow-md md:block"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-ui text-ink-soft">ログイン中</p>
                    <p className="text-ui font-bold text-ink wrap-anywhere">{user.displayName} さん</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center px-4 text-ui text-ink hover:bg-accent-soft transition-colors"
                  >
                    設定
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex min-h-11 w-full items-center px-4 text-left text-ui text-ink-soft hover:bg-accent-soft hover:text-ink transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
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
        <div ref={overlayRef} className="fixed inset-0 z-10 flex flex-col bg-ground md:hidden">
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
            <p className="text-preview font-bold text-ink wrap-anywhere">{user.displayName} さん</p>
          </div>

          <nav className="flex flex-col">
            <Link
              href={BOARD_HREF}
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
