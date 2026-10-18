"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { withNext } from "@/lib/next-path";

/**
 * ログインしていない人が、ログインの要る操作をしたときに出すポップアップ。
 *
 * ボタンを押せなくして黙っていると、壊れているように見える。
 * かといって、すぐログイン画面へ移ると、読んでいた場所を失う。
 * だから、ここで理由を伝え、ログインするかどうかは本人に選んでもらう。
 *
 * 開き方と閉じ方は ConfirmDialog と同じく、ブラウザの <dialog> に任せる。
 */
export function LoginRequiredDialog({
  open,
  title,
  children,
  next,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  /** ログインのあとに戻る先。今いるページの道を渡す */
  next: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-ippo border border-border bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 id={titleId} className="mb-3 text-subtitle font-bold text-ink">
          {title}
        </h2>
        <div className="mb-6 text-ui text-ink-soft">{children}</div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-ippo border border-border-strong bg-surface px-5 py-2.5 text-ui text-ink hover:bg-accent-soft transition-colors"
          >
            やめる
          </button>
          <Link
            href={withNext("/login", next)}
            className="inline-flex min-h-11 items-center rounded-ippo bg-accent px-5 py-2.5 text-ui font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
          >
            ログイン
          </Link>
        </div>
        <p className="mt-5 text-right text-ui text-ink-soft">
          はじめての方は{" "}
          <Link
            href={withNext("/signup", next)}
            className="font-bold text-accent underline underline-offset-4 hover:text-ink transition-colors"
          >
            新規登録
          </Link>
        </p>
      </div>
    </dialog>
  );
}
