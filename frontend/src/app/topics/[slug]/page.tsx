"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, type SortOrder } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { TopicNav } from "@/components/TopicNav";
import { PostItem } from "@/components/PostItem";

const SORTS: SortOrder[] = ["popular", "newest", "oldest"];

function Board() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();

  // URL に知らない値が入っていても落とさない。既定に倒す。
  const raw = params.get("sort");
  const sort: SortOrder = SORTS.includes(raw as SortOrder)
    ? (raw as SortOrder)
    : "popular";

  const { data: posts, error } = useSWR(["posts", slug, sort], () =>
    api.posts(slug, sort),
  );

  return (
    <main className="mx-auto w-full max-w-[840px] px-4 pb-22 md:px-8">
      <TopicNav slug={slug} sort={sort} />

      {error && (
        <p role="alert" className="mt-12 text-[19px] leading-loose text-danger">
          {error instanceof ApiError ? error.detail : "読み込みに失敗しました"}
        </p>
      )}

      {/*
        読み込み中は何も出さない。数十件の一覧に凝った表示を足しても
        体感は変わらず、作る量が増えるだけ。
      */}
      {posts && posts.length === 0 && (
        <p className="mt-12 text-[19px] leading-loose text-ink-soft">
          まだ投稿がありません。最初の一歩をどうぞ。
        </p>
      )}

      {posts?.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </main>
  );
}

export default function BoardPage() {
  // useSearchParams を使うコンポーネントは Suspense で包む必要がある。
  // 包まないとビルドが止まる。
  return (
    <Suspense>
      <Board />
    </Suspense>
  );
}
