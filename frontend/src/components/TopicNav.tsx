"use client";

import Link from "next/link";
import useSWR from "swr";
import { api, type SortOrder } from "@/lib/api";

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "popular", label: "人気順" },
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

function chipClass(active: boolean) {
  return `inline-flex min-h-11 items-center rounded-ippo px-3.5 py-2 text-preview ${
    active
      ? "border-2 border-accent bg-accent-soft font-bold text-ink"
      : "border border-border-strong bg-surface text-ink hover:bg-accent-soft hover:border-accent transition-colors"
  }`;
}

/**
 * トピックの切り替えと並び順。
 *
 * slug を渡さなければ「すべて」を見ている状態になる。
 */
export function TopicNav({ slug, sort }: { slug?: string; sort: SortOrder }) {
  const { data: topics } = useSWR("topics", () => api.topics());
  const basePath = slug ? `/topics/${slug}` : "/posts";

  return (
    <>
      {/*
        トピックは後から増える。横一列にすると増えた分が画面の外に出るので、
        折り返して下に伸ばす。並び順は3つで固定なので、そちらはタブのまま。
        見た目を分けることで、増えるものと増えないものを区別している。

        選んでいるものには aria-current を付ける。枠と背景の色だけでは、
        読み上げではどれを選んでいるか伝わらない。
      */}
      <nav aria-label="トピック" className="flex flex-wrap gap-2 border-b border-border py-4">
        {/*
          「すべて」はトピックではないが、同じ形のチップにして先頭に置く。
          別の形にすると、これは何だろうと一瞬考えさせる。
          先頭なら、全体から個別へ、の順に読める。
        */}
        <Link
          href="/posts"
          aria-current={slug ? undefined : "page"}
          className={chipClass(!slug)}
        >
          すべて
        </Link>
        {topics?.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            aria-current={t.slug === slug ? "page" : undefined}
            className={chipClass(t.slug === slug)}
          >
            {t.name}
          </Link>
        ))}
      </nav>

      {/*
        並び順を URL に出す。戻るボタンで前の並びに戻れるし、
        人に送った URL が同じ画面を開く。
      */}
      <div className="mt-6 flex items-baseline gap-4">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={`${basePath}?sort=${s.value}`}
            aria-current={s.value === sort ? "page" : undefined}
            className={`flex min-h-11 items-center border-b-3 py-2.5 text-ui hover:text-ink transition-colors ${
              s.value === sort
                ? "border-accent font-bold text-ink"
                : "border-transparent text-ink-soft"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </>
  );
}
