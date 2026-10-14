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
    /*
      role="status" の箱は、知らせが無いときも置いておく。
      箱ごと後から足すと、読み上げソフトが中身の変化に気づかないことがある。

      ヘッダー（高さ 56px）のすぐ下に出す。投稿して詳細へ移ったあと、目が行くのは
      上のタイトルなので、その近くに置く。下に出すと、iPhone の Safari では
      画面の下にあるアドレスバーの近くに重なる。ヘッダーに重ねると、ヘッダーのボタンが押せなくなる。
      「〇〇にもどる」のリンクに重なるので、pointer-events-none でクリックを下へ通す。
    */
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[68px] z-50 flex justify-center px-4"
    >
      {toast && (
        <div className="flex items-center gap-2.5 rounded-ippo border border-accent bg-surface px-4 py-3 text-ui font-bold text-ink shadow-lg">
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
