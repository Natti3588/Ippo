import Link from "next/link";
import type { SortOrder } from "@/lib/api";

export function Pagination({
  slug,
  sort,
  page,
  hasNext,
}: {
  slug: string;
  sort: SortOrder;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;

  const href = (p: number) => `/topics/${slug}?sort=${sort}&page=${p}`;

  return (
    <nav className="mt-10 flex items-center justify-between border-t border-border pt-6">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="inline-flex min-h-11 items-center rounded-ippo border border-border-strong bg-surface px-4 py-2 text-ui text-ink hover:bg-accent-soft hover:border-accent transition-colors"
        >
          ← 前のページ
        </Link>
      ) : (
        <span />
      )}

      <span className="text-ui text-ink-soft">{page} ページ目</span>

      {hasNext ? (
        <Link
          href={href(page + 1)}
          className="inline-flex min-h-11 items-center rounded-ippo border border-border-strong bg-surface px-4 py-2 text-ui text-ink hover:bg-accent-soft hover:border-accent transition-colors"
        >
          次のページ →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
