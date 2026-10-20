import Link from "next/link";
import type { SortOrder } from "@/lib/api";

// 高さ 36px（min-h-9）。押せる大きさの基準 24px は満たす。
const buttonClass =
  "inline-flex min-h-9 items-center rounded-ippo border px-3 py-1.5 text-ui transition-colors";
const enabledClass =
  "border-border-strong bg-surface text-ink hover:bg-accent-soft hover:border-accent";
// 押せない側も同じ形で出す。消すと片側だけにボタンが並び、左右が釣り合わない。
// 枠は押せる側と同じ濃さにする。枠まで薄くすると、押せる側だけが重く見えて、
// 真ん中に置いていても片側へ寄って見える。押せないことは、白い背景がないことと薄い文字で示す。
const disabledClass = "border-border-strong text-ink-soft/50";

export function Pagination({
  basePath,
  sort,
  page,
  hasNext,
}: {
  /** 一覧の行き先。/topics/{slug} か /posts */
  basePath: string;
  sort: SortOrder;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;

  const href = (p: number) => `${basePath}?sort=${sort}&page=${p}`;

  return (
    // 左右の列を同じ幅（1fr）にして、ページ数をいつも真ん中に置く。
    // ボタンはページ数の側へ寄せて、全体を真ん中にまとめる。
    <nav className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-5 border-t border-border pt-6">
      <div className="justify-self-end">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            aria-label="前のページ"
            className={`${buttonClass} ${enabledClass}`}
          >
            ← 前へ
          </Link>
        ) : (
          <span aria-disabled="true" className={`${buttonClass} ${disabledClass}`}>
            ← 前へ
          </span>
        )}
      </div>

      <span className="text-ui text-ink-soft">{page} ページ目</span>

      <div className="justify-self-start">
        {hasNext ? (
          <Link
            href={href(page + 1)}
            aria-label="次のページ"
            className={`${buttonClass} ${enabledClass}`}
          >
            次へ →
          </Link>
        ) : (
          <span aria-disabled="true" className={`${buttonClass} ${disabledClass}`}>
            次へ →
          </span>
        )}
      </div>
    </nav>
  );
}
