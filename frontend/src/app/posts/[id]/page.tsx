"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { api, type Post } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { formatDateTime } from "@/lib/format";
import { safeNextPath } from "@/lib/next-path";
import { BOARD_HREF } from "@/lib/topics";
import { showToast } from "@/lib/toast";
import { Markdown } from "@/components/Markdown";
import { PageColumns } from "@/components/PageColumns";
import { StudyCard } from "@/components/StudyCard";

// 来た一覧へ戻す。分からないとき（URL を直接開いたなど）は投稿のトピックへ
function backLink(from: string, topic: Post["topic"]) {
  const topicPath = `/topics/${topic.slug}`;
  // "/posts/…"（詳細ページ）まで当たらないよう、「すべて」の一覧だけを見る
  if (from === "/posts" || from.startsWith("/posts?")) {
    return { href: from, label: "すべての投稿" };
  }
  if (from === topicPath || from.startsWith(`${topicPath}?`)) {
    return { href: from, label: topic.name };
  }
  return { href: topicPath, label: topic.name };
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // 誰でも書き換えられる値なので、サイトの中の道だけを通す
  const from = safeNextPath(useSearchParams().get("from"));
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
      // replace で移る。push だと「戻る」で消えた投稿の画面に戻ってしまう
      router.replace(backLink(from, post.topic).href);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "削除に失敗しました");
      setRemoving(false);
      setConfirming(false);
    }
  }

  if (error) {
    // 形の正しくない ID は 400 で返るが、利用者には「見つからない」と同じ
    const message = !(error instanceof ApiError)
      ? "読み込みに失敗しました"
      : error.status === 400
        ? "投稿が見つかりません"
        : error.detail;
    return (
      <PageColumns aside={<StudyCard />}>
        <Card padding={5}>
          <p role="alert" className="text-error">
            {message}
          </p>
          <Link href={BOARD_HREF} className="mt-4 inline-block text-primary underline underline-offset-4">
            掲示板にもどる
          </Link>
        </Card>
      </PageColumns>
    );
  }

  if (!post) return null;

  const back = backLink(from, post.topic);

  return (
    <PageColumns aside={<StudyCard />}>
      <div className="flex flex-col gap-4">
        <Link href={back.href} className="text-secondary hover:text-primary">
          ‹ {back.label} にもどる
        </Link>

        {failure && (
          <p role="alert" className="text-error">
            {failure}
          </p>
        )}

        <Card padding={6}>
          <article className="flex flex-col gap-5">
            <header className="flex flex-col gap-2 border-b border-border pb-5">
              <h1 className="text-2xl font-bold text-pretty wrap-anywhere">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-secondary">
                <span className="wrap-anywhere">{post.authorName}</span>
                <time dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>
                {/* いいねした人が見た内容と、今の内容が違うことがあるので示す */}
                {post.updatedAt && <span>編集済み</span>}
              </div>
            </header>

            {/* 15,000 文字まで書けるので、行の長さを 40em で止める */}
            <div className="max-w-[40em] leading-relaxed wrap-anywhere">
              <Markdown>{post.body}</Markdown>
            </div>

            {post.isMine && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                <Button label="編集する" variant="secondary" href={`/posts/${post.id}/edit`} />
                <Button label="削除する" variant="ghost" onClick={() => setConfirming(true)} />
              </div>
            )}
          </article>
        </Card>
      </div>

      <AlertDialog
        isOpen={confirming}
        // 削除の通信中は閉じない。閉じても削除は止まらず、結果が見えなくなるだけ
        onOpenChange={(isOpen) => !isOpen && !removing && setConfirming(false)}
        title="投稿を削除しますか？"
        description={`「${post.title}」を削除します。削除すると、元に戻せません。`}
        actionLabel="削除する"
        actionVariant="destructive"
        isActionLoading={removing}
        onAction={remove}
      />
    </PageColumns>
  );
}
