"use client";

import { Pagination as AstryxPagination } from "@astryxdesign/core/Pagination";
import type { SortOrder } from "@/lib/api";

export function Pagination({
  basePath,
  sort,
  page,
  hasNext,
}: {
  // 一覧の行き先。/topics/{slug} か /posts
  basePath: string;
  sort: SortOrder;
  page: number;
  hasNext: boolean;
}) {
  if (page === 1 && !hasNext) return null;

  // 全体のページ数は API が返さないので、次があるかどうかだけで送る
  return (
    <div className="mt-6 flex justify-center">
      <AstryxPagination
        page={page}
        hasMore={hasNext}
        onChange={() => {}}
        getPageHref={(p) => `${basePath}?sort=${sort}&page=${p}`}
      />
    </div>
  );
}
