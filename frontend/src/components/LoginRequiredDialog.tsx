"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { withNext } from "@/lib/next-path";

// ログインの要る操作を未ログインの人がしたときに、理由を伝えてログインへ案内する。
// すぐログイン画面へ移すと、読んでいた場所を失うため
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
  // ログインのあとに戻る先
  next: string;
  onClose: () => void;
}) {
  return (
    <Dialog isOpen={open} onOpenChange={(isOpen) => !isOpen && onClose()} width={420} padding={5}>
      <div className="flex flex-col gap-4">
        <DialogHeader title={title} onOpenChange={(isOpen) => !isOpen && onClose()} />
        <div className="text-secondary">{children}</div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button label="やめる" variant="secondary" onClick={onClose} />
          <Button label="ログイン" variant="primary" href={withNext("/login", next)} />
        </div>
        <p className="text-right text-sm text-secondary">
          はじめての方は{" "}
          <Link href={withNext("/signup", next)} className="font-bold text-primary underline underline-offset-4">
            新規登録
          </Link>
        </p>
      </div>
    </Dialog>
  );
}
