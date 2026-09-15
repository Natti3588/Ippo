"use client";

import Link from "next/link";
import type { PostSummary } from "@/lib/api";
import { formatDate } from "@/lib/format";

export function PostItem({
  post,
  canLike,
  onToggleLike,
  onDelete,
}: {
  post: PostSummary;
  /** 未ログインのときは押せない。数だけ見せる */
  canLike: boolean;
  onToggleLike: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="border-t border-border py-9">
      {/*
        自分の投稿かどうかを文字でも示す。枠の色だけで示すと、
        色の見分けがつきにくい人に伝わらない。
      */}
      {post.isMine && (
        <p className="mb-3 text-ui font-bold text-accent">あなたの投稿</p>
      )}

      {/* 投稿のタイトルと本文にだけ英語向けの書体を当てる */}
      <Link
        href={`/posts/${post.id}`}
        className="mb-4 block font-read text-subtitle font-semibold text-ink"
      >
        {post.title}
      </Link>

      <p className="mb-5 max-w-[34em] font-read text-preview text-ink-soft">
        {post.bodyPreview}
      </p>

      <div className="flex flex-wrap items-center gap-6">
        {/*
          自分の投稿にだけ出す。authorName では比べない。
          表示名は一意ではないので、同じ名前の人の投稿まで消せてしまう。
        */}
        {post.isMine && (
          <button
            type="button"
            onClick={onDelete}
            className="flex min-h-12 items-center py-3.5 text-ui text-danger underline underline-offset-4"
          >
            削除する
          </button>
        )}

        {/*
          「続きを読む」を出すかどうかは truncated で決める。
          bodyPreview の長さから推測しない。文字の数え方がサーバーと違う。
        */}
        {post.truncated && (
          <Link
            href={`/posts/${post.id}`}
            className="flex min-h-12 items-center text-ui font-bold text-accent underline underline-offset-4"
          >
            続きを読む
          </Link>
        )}

        <div className="grow" />

        <span className="text-ui text-ink-soft">{post.authorName}</span>
        <span className="text-ui text-ink-soft">
          {formatDate(post.createdAt)}
        </span>

        <button
          type="button"
          onClick={onToggleLike}
          disabled={!canLike}
          className={`flex min-h-12 items-center gap-2.5 rounded-ippo border px-5 py-3 text-ui tabular-nums ${
            post.likedByMe
              ? "border-accent bg-accent-soft font-bold text-accent"
              : "border-border-strong text-ink-soft"
          } disabled:cursor-default`}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? "いいねを取り消す" : "いいねする"}
        >
          {/*
            色だけで区別しない。押していればハートを塗り、押していなければ
            線だけにする。色の見分けがつきにくい人にも伝わるようにする。
          */}
          <svg
            width="18"
            height="18"
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
