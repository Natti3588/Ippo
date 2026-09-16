"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, type PostSummary, type SortOrder } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { useAuth } from "@/lib/auth";
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

  const { user } = useAuth();
  const { data: posts, error, mutate } = useSWR(["posts", slug, sort], () =>
    api.posts(slug, sort),
  );

  async function toggleLike(target: PostSummary) {
    if (!posts) return;

    const next = posts.map((p) =>
      p.id === target.id
        ? {
            ...p,
            likedByMe: !p.likedByMe,
            likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
          }
        : p,
    );

    try {
      await mutate(
        async () => {
          if (target.likedByMe) {
            await api.unlike(target.id);
          } else {
            await api.like(target.id);
          }
          // 204 なので新しい一覧は返ってこない。手元で作ったものをそのまま使う。
          return next;
        },
        {
          optimisticData: next,
          rollbackOnError: true,
          // 成功しても取り直さない。人気順のときに、見ている最中で
          // 並びが入れ替わってしまう。正確な数は次に開いたときに揃う。
          revalidate: false,
        },
      );
    } catch {
      // rollbackOnError が数を戻してくれる。ここでは何もしない。
    }
  }

  const [failure, setFailure] = useState<string | null>(null);

  async function remove(target: PostSummary) {
    // 自前のダイアログを作らずブラウザのものを使う。
    // 見た目は揃わないが、取り消せない操作に確認を挟むほうが先。
    if (!window.confirm(`「${target.title}」を削除します。取り消せません。`)) {
      return;
    }

    setFailure(null);
    try {
      await api.deletePost(target.id);
      // いいねは外部キーの ON DELETE CASCADE で一緒に消える。ここで消す必要はない。
      await mutate();
    } catch (err) {
      // 他人の投稿は 403、未ログインは 401 が返る。detail をそのまま出す。
      setFailure(err instanceof ApiError ? err.detail : "削除に失敗しました");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      <TopicNav slug={slug} sort={sort} />

      {error && (
        <p role="alert" className="mt-8 text-preview text-danger">
          {error instanceof ApiError ? error.detail : "読み込みに失敗しました"}
        </p>
      )}

      {failure && (
        <div role="alert" className="mt-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      {/*
        読み込み中は何も出さない。数十件の一覧に凝った表示を足しても
        体感は変わらず、作る量が増えるだけ。
      */}
      {posts && posts.length === 0 && (
        <p className="mt-8 text-preview text-ink-soft">
          まだ投稿がありません。最初の一歩をどうぞ。
        </p>
      )}

      {posts?.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          canLike={Boolean(user)}
          onToggleLike={() => toggleLike(post)}
          onDelete={() => remove(post)}
        />
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
