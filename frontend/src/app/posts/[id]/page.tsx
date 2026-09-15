"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { formatDateTime } from "@/lib/format";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: post, error } = useSWR(["post", id], () => api.post(id));

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[840px] px-4 py-16 md:px-8">
        <p role="alert" className="text-[19px] leading-loose text-danger">
          {error instanceof ApiError ? error.detail : "読み込みに失敗しました"}
        </p>
        <p className="mt-8">
          <Link
            href="/topics/study-method"
            className="text-[17px] text-accent underline underline-offset-4"
          >
            掲示板にもどる
          </Link>
        </p>
      </main>
    );
  }

  // 読み込み中は何も出さない。スピナーを作らない。
  if (!post) return null;

  return (
    <main className="mx-auto w-full max-w-[840px] px-4 pb-22 md:px-8">
      {/*
        戻り先は post.topic から作る。
        一覧は topic を返さないので、パンくずはこの画面でしか作れない。
      */}
      <nav className="py-6">
        <Link
          href={`/topics/${post.topic.slug}`}
          className="inline-flex min-h-12 items-center gap-2.5 text-[17px] text-ink-soft"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {post.topic.name} にもどる
        </Link>
      </nav>

      <article>
        {/* text-pretty で、見出しの最後の行に1語だけ残るのを防ぐ */}
        <h1 className="mb-6 max-w-[22em] text-pretty font-read text-[34px] font-semibold leading-snug text-ink">
          {post.title}
        </h1>

        <div className="mb-11 flex items-center gap-5 border-b-3 border-ink pb-8">
          <span className="text-[17px] text-ink-soft">{post.authorName}</span>
          {/* time にすると、読み上げが日付だと分かる */}
          <time dateTime={post.createdAt} className="text-[17px] text-ink-soft">
            {formatDateTime(post.createdAt)}
          </time>
        </div>

        {/*
          本文。34em で行長を止める。
          15,000文字まで許しているので、画面幅いっぱいだと折り返しで目線が迷う。

          whitespace-pre-wrap は、書いた人の改行をそのまま出すため。
          これが無いと段落が全部つながる。
        */}
        <div className="max-w-[34em] whitespace-pre-wrap font-read text-[21px] leading-[2.05] text-ink">
          {post.body}
        </div>

        {/* いいねと削除は段階2・3で足す */}
      </article>
    </main>
  );
}
