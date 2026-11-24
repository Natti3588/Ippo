"use client";

import { useEffect } from "react";
import { hideToast, useToast } from "@/lib/toast";

const SHOW_MS = 4000;

export function Toast() {
  const toast = useToast();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => hideToast(toast.id), SHOW_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    // 箱は知らせが無いときも置く。後から足すと、読み上げソフトが変化に気づかないことがある。
    // ヘッダー（高さ 64px）のすぐ下に出し、下のリンクを押せるようにクリックを通す
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
    >
      {toast && (
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-primary shadow-lg">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-accent"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {toast.text}
        </div>
      )}
    </div>
  );
}
