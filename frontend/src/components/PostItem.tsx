"use client";

import Link from "next/link";
import type { PostSummary } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Markdown } from "@/components/Markdown";

export function PostItem({
  post,
  from,
  showTopic = false,
  onToggleLike,
  onDelete,
}: {
  post: PostSummary;
  from: string;
  // 「すべて」の一覧のときだけ true。どのトピックの投稿かを出す
  showTopic?: boolean;
  // 未ログインでも押せる。ログインを促すかは呼ぶ側が決める
  onToggleLike: () => void;
  onDelete: () => void;
}) {
  const detailHref = `/posts/${post.id}?from=${encodeURIComponent(from)}`;
  return (
    <article className="flex flex-col gap-2 border-t border-border py-5 first:border-t-0 first:pt-0 last:pb-0">
      {(showTopic || post.isMine) && (
        <div className="flex items-center gap-3 text-sm">
          {showTopic && (
            <Link href={`/topics/${post.topic.slug}`} className="text-secondary hover:underline">
              {post.topic.name}
            </Link>
          )}
          {/* 自分の投稿は色だけでなく文字でも示す */}
          {post.isMine && <span className="font-bold text-accent">あなたの投稿</span>}
        </div>
      )}

      <Link
        href={`${detailHref}`}
        className="text-lg font-bold text-primary wrap-anywhere hover:underline"
      >
        {post.title}
      </Link>

      <p className="text-secondary wrap-anywhere">
        <Markdown plain>{post.bodyPreview}</Markdown>
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-secondary">
        {/* truncated はサーバーが決める。プレビューの長さからは推測しない */}
        {post.truncated && (
          <Link href={`${detailHref}`} className="font-bold text-primary underline underline-offset-4">
            続きを読む
          </Link>
        )}
        {/* プレビューでは画像を外しているので、画像があることを文字で知らせる */}
        {post.hasImage && <span>画像あり</span>}
        {post.isMine && (
          <button type="button" onClick={onDelete} className="text-error underline underline-offset-4">
            削除する
          </button>
        )}

        <div className="grow" />

        <span className="wrap-anywhere">{post.authorName}</span>
        <span>{formatDate(post.createdAt)}</span>

        <button
          type="button"
          onClick={onToggleLike}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? "いいねを取り消す" : "いいねする"}
          className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 tabular-nums transition-colors ${
            post.likedByMe
              ? "border-accent bg-accent-muted font-bold text-primary"
              : "border-border hover:border-strong hover:text-primary"
          }`}
        >
          {/* 押したかどうかは塗りでも示す */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={post.likedByMe ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {post.likeCount}
        </button>
      </div>
    </article>
  );
}
