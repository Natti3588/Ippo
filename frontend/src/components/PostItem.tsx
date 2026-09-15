"use client";

import Link from "next/link";
import type { PostSummary } from "@/lib/api";
import { formatDate } from "@/lib/format";

export function PostItem({ post }: { post: PostSummary }) {
  return (
    <article className="border-t border-border py-9">
      {/*
        自分の投稿かどうかを文字でも示す。枠の色だけで示すと、
        色の見分けがつきにくい人に伝わらない。
      */}
      {post.isMine && (
        <p className="mb-3 text-[15px] font-bold text-accent">あなたの投稿</p>
      )}

      {/* 投稿のタイトルと本文にだけ英語向けの書体を当てる */}
      <Link
        href={`/posts/${post.id}`}
        className="mb-4 block font-read text-[23px] font-semibold leading-relaxed text-ink"
      >
        {post.title}
      </Link>

      <p className="mb-5 max-w-[34em] font-read text-[19px] leading-loose text-ink-soft">
        {post.bodyPreview}
      </p>

      <div className="flex flex-wrap items-center gap-6">
        {/*
          「続きを読む」を出すかどうかは truncated で決める。
          bodyPreview の長さから推測しない。文字の数え方がサーバーと違う。
        */}
        {post.truncated && (
          <Link
            href={`/posts/${post.id}`}
            className="flex min-h-12 items-center text-[17px] font-bold text-accent underline underline-offset-4"
          >
            続きを読む
          </Link>
        )}

        <div className="grow" />

        <span className="text-[17px] text-ink-soft">{post.authorName}</span>
        <span className="text-[17px] text-ink-soft">
          {formatDate(post.createdAt)}
        </span>

        {/* いいねと削除は段階3・4で足す */}
      </div>
    </article>
  );
}
