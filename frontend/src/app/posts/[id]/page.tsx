"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { formatDateTime } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BOARD_HREF } from "@/lib/topics";
import { showToast } from "@/lib/toast";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();

  const router = useRouter();

  const { data: post, error } = useSWR(["post", id], () => api.post(id));

  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function remove() {
    if (!post) return;

    setFailure(null);
    setRemoving(true);
    try {
      await api.deletePost(post.id);
      showToast("投稿を削除しました");
      // replace で移る。push だと、ブラウザの「戻る」で消えた投稿の画面に戻り、
      // 「見つかりません」が出る。
      router.replace(`/topics/${post.topic.slug}`);
    } catch (err) {
      // 他人の投稿は 403、未ログインは 401 が返る。detail をそのまま出す。
      setFailure(err instanceof ApiError ? err.detail : "削除に失敗しました");
      setRemoving(false);
      setConfirming(false);
    }
  }

  if (error) {
    const message = !(error instanceof ApiError)
      ? "読み込みに失敗しました"
      : error.status === 400
        ? "投稿が見つかりません"
        : error.detail;
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p role="alert" className="text-preview text-danger">
          {message}
        </p>
        <p className="mt-5">
          <Link
            href={BOARD_HREF}
            className="text-ui text-accent underline underline-offset-4 hover:text-ink transition-colors"
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
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      {/*
        戻り先は post.topic から作る。
        一覧は topic を返さないので、パンくずはこの画面でしか作れない。
      */}
      <nav className="py-4">
        <Link
          href={`/topics/${post.topic.slug}`}
          className="inline-flex min-h-11 items-center gap-2 text-ui text-ink-soft hover:text-ink transition-colors"
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

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      <article>
        {/* text-pretty で、見出しの最後の行に1語だけ残るのを防ぐ */}
        <h1 className="mb-4 max-w-[22em] text-pretty font-read text-title font-semibold text-ink wrap-anywhere">
          {post.title}
        </h1>

        <div className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 border-b-3 border-ink pb-5">
          <span className="text-ui text-ink-soft wrap-anywhere">{post.authorName}</span>
          {/* time にすると、読み上げが日付だと分かる */}
          <time dateTime={post.createdAt} className="text-ui text-ink-soft">
            {formatDateTime(post.createdAt)}
          </time>
          {/* 直したことを示す。いいねした人が見た内容と、今の内容が違うことがあるため */}
          {post.updatedAt && <span className="text-ui text-ink-soft">編集済み</span>}
        </div>

        {/*
          本文。34em で行長を止める。
          15,000文字まで許しているので、画面幅いっぱいだと折り返しで目線が迷う。

          改行は Markdown 側（remark-breaks）が <br> にする。
          whitespace-pre-wrap を付けると、タグの間の改行まで表示されて余白が崩れる。
        */}
        <div className="max-w-[34em] font-read text-body text-ink wrap-anywhere">
          <Markdown>{post.body}</Markdown>
        </div>

        {/*
          自分の投稿にだけ出す。authorName では比べない。
          表示名は一意ではないので、同じ名前の人の投稿まで消せてしまう。
        */}
        {post.isMine && (
          <div className="mt-10 flex flex-wrap items-center gap-5 border-t border-border pt-5">
            <Link
              href={`/posts/${post.id}/edit`}
              className="flex min-h-11 items-center py-2.5 text-ui text-accent underline underline-offset-4 hover:text-ink transition-colors"
            >
              編集する
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex min-h-11 items-center py-2.5 text-ui text-danger underline underline-offset-4 hover:bg-danger-soft transition-colors"
            >
              削除する
            </button>
          </div>
        )}

        {/* いいねは段階2で足す */}
      </article>

      <ConfirmDialog
        open={confirming}
        title="投稿を削除しますか？"
        confirmLabel="削除する"
        busyLabel="削除中…"
        busy={removing}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        {/* タイトルは最大100文字で、英語の長い単語も入る。枠からはみ出さないよう、どこでも折り返す */}
        <p className="wrap-anywhere">「{post.title}」を削除します。</p>
        <p>削除すると、元に戻せません。</p>
      </ConfirmDialog>
    </main>
  );
}
