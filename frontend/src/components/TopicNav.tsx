"use client";

import Link from "next/link";
import useSWR from "swr";
import { api, type SortOrder } from "@/lib/api";

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "popular", label: "人気順" },
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

export function TopicNav({ slug, sort }: { slug: string; sort: SortOrder }) {
  const { data: topics } = useSWR("topics", () => api.topics());

  return (
    <>
      {/*
        トピックは後から増える。横一列にすると増えた分が画面の外に出るので、
        折り返して下に伸ばす。並び順は3つで固定なので、そちらはタブのまま。
        見た目を分けることで、増えるものと増えないものを区別している。
      */}
      <nav className="flex flex-wrap gap-3 border-b border-border py-6">
        {topics?.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className={`inline-flex min-h-12 items-center rounded-ippo px-5 py-3 text-preview ${
              t.slug === slug
                ? "border-2 border-accent bg-accent-soft font-bold text-ink"
                : "border border-border-strong bg-surface text-ink"
            }`}
          >
            {t.name}
          </Link>
        ))}
      </nav>

      {/*
        並び順を URL に出す。戻るボタンで前の並びに戻れるし、
        人に送った URL が同じ画面を開く。
      */}
      <div className="mt-10 flex items-baseline gap-6">
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={`/topics/${slug}?sort=${s.value}`}
            className={`flex min-h-12 items-center border-b-3 py-3.5 text-ui ${
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
