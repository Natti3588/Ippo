"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BOARD_HREF } from "@/lib/topics";

export function Header() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  // トピックの画面から投稿するときは、そのトピックを選んだ状態で投稿の画面を開く
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : null;
  const newPostHref = slug ? `/posts/new?topic=${encodeURIComponent(slug)}` : "/posts/new";

  async function logout() {
    try {
      await api.logout();
    } finally {
      // 失敗しても手元はログアウトにする。ログイン中の画面が残るほうが困る
      setUser(null);
      router.push("/");
    }
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-primary">
            Ippo
          </Link>
          {/* ログイン中のスマホでは、メニューの中に同じリンクがある */}
          <nav className={`items-center gap-5 ${user ? "hidden md:flex" : "flex"}`}>
            <Link href={BOARD_HREF} className="text-secondary hover:text-primary">
              掲示板
            </Link>
            {user && (
              <Link href="/study" className="text-secondary hover:text-primary">
                学習の記録
              </Link>
            )}
          </nav>
        </div>

        {/* ログインを確かめているあいだは出さない。出してから消すとちらつく */}
        {user === undefined ? null : user ? (
          <div className="flex items-center gap-2">
            <Button label="投稿する" href={newPostHref} variant="primary" />
            <DropdownMenu
              presentation="adaptive"
              hasChevron={false}
              button={{ label: "メニュー", icon: <Icon icon="menu" />, isIconOnly: true, variant: "ghost" }}
              header={
                <div className="px-3 py-2">
                  <p className="text-sm text-secondary">ログイン中</p>
                  <p className="font-bold wrap-anywhere">{user.displayName} さん</p>
                </div>
              }
              items={[
                { label: "掲示板", href: BOARD_HREF },
                { label: "学習の記録", href: "/study" },
                { label: "設定", href: "/settings" },
                { type: "divider" },
                { label: "ログアウト", onClick: logout },
              ]}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button label="ログイン" href="/login" variant="ghost" />
            <Button label="はじめる" href="/signup" variant="primary" />
          </div>
        )}
      </div>
    </header>
  );
}
