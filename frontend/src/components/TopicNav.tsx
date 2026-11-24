"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SegmentedControl } from "@astryxdesign/core/SegmentedControl";
import { SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { api, type SortOrder } from "@/lib/api";

const SORTS: { value: SortOrder; label: string }[] = [
  { value: "popular", label: "人気順" },
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

// slug がなければ「すべて」を選んでいる
export function TopicNav({ slug, sort }: { slug?: string; sort: SortOrder }) {
  const router = useRouter();
  const { data: topics } = useSWR("topics", () => api.topics());
  const basePath = slug ? `/topics/${slug}` : "/posts";

  return (
    <div className="flex flex-col gap-4">
      {/* タブはリンクで移るので、onChange では何もしない */}
      <TabList value={slug ?? "all"} onChange={() => {}} overflow="scroll" aria-label="トピック">
        <Tab value="all" label="すべて" href="/posts" />
        {topics?.map((t) => (
          <Tab key={t.slug} value={t.slug} label={t.name} href={`/topics/${t.slug}`} />
        ))}
      </TabList>

      {/* 並び順は URL に出す。戻るボタンで前の並びに戻れる */}
      <SegmentedControl
        label="並び順"
        value={sort}
        onChange={(value) => router.push(`${basePath}?sort=${value}`)}
      >
        {SORTS.map((s) => (
          <SegmentedControlItem key={s.value} value={s.value} label={s.label} />
        ))}
      </SegmentedControl>
    </div>
  );
}
