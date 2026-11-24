"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { withNext } from "@/lib/next-path";

const linkClass =
  "font-bold text-accent underline underline-offset-4 hover:text-primary transition-colors";

// ログインと新規登録を行き来するリンク。今の ?next= を引き継ぐ。
// ここだけを Suspense で包み、フォームは最初の HTML に入れる
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
