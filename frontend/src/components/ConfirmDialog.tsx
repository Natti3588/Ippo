"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * 取り消せない操作の前に出す確認のポップアップ。
 *
 * ブラウザの <dialog> を showModal() で開く。次のことをブラウザが受け持つので、自前で書かない。
 * - ほかの部分を押せなくする。Tab でもポップアップの外へ出ない
 * - Esc で閉じる
 * - いちばん手前に出す（z-index を気にしなくてよい）
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // 最初は「やめる」に合わせる。Enter を続けて押しても消えないようにする。
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc で閉じたとき。開いている状態を持つのは呼ぶ側なので、知らせて揃える。
      onClose={onCancel}
      // 通信中は Esc でも閉じない。閉じても削除は止まらないので、結果が見えなくなるだけ。
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      // 外側の暗い部分を押したら閉じる。暗い部分を押しても、target は dialog 自身になる。
      // 中身は内側の div に入れてあるので、中を押したときの target は dialog にならない。
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[420px] rounded-ippo border border-border bg-surface p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h2 id={titleId} className="mb-3 text-subtitle font-bold text-ink">
          {title}
        </h2>
        <div className="mb-6 text-ui text-ink-soft">{children}</div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-ippo border border-border-strong bg-surface px-5 py-2.5 text-ui text-ink hover:bg-accent-soft transition-colors disabled:opacity-60"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center rounded-ippo bg-danger px-5 py-2.5 text-ui font-bold text-surface hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
