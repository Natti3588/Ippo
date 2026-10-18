"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { withNext } from "@/lib/next-path";

const linkClass =
  "font-bold text-accent underline underline-offset-4 hover:text-ink transition-colors";

/**
 * ログインと新規登録の画面を行き来するリンク。今の ?next= を引き継ぐ。
 * 引き継がないと、途中で新規登録に切り替えた人だけトップに戻されてしまう。
 *
 * useSearchParams を使うのはこのリンクだけにして、ここだけを Suspense で包む。
 * 画面全体を包むと、フォームが最初の HTML に入らなくなる。
 * 読み込むまでは next を付けないリンクを出しておく。
 */
export function AuthSwitchLink({
  href,
  children,
}: {
  href: "/login" | "/signup";
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={linkClass}>
          {children}
        </Link>
      }
    >
      <LinkWithNext href={href}>{children}</LinkWithNext>
    </Suspense>
  );
}

function LinkWithNext({
  href,
  children,
}: {
  href: "/login" | "/signup";
  children: ReactNode;
}) {
  const next = useSearchParams().get("next");
  return (
    <Link href={withNext(href, next)} className={linkClass}>
      {children}
    </Link>
  );
}
