"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, type PostSummary, type SortOrder } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { useAuth } from "@/lib/auth";
import { TopicNav } from "@/components/TopicNav";
import { PostItem } from "@/components/PostItem";
import { Pagination } from "@/components/Pagination";

const SORTS: SortOrder[] = ["popular", "newest", "oldest"];

/**
 * 投稿の一覧。取得・いいね・削除・ページ送りをまとめて持つ。
 *
 * slug を渡せばそのトピックの一覧、渡さなければすべてのトピックの一覧になる。
 * 2つの画面で同じ部品を使うのは、いいねと削除の処理を2か所に書かないため。
 * 片方だけ直して、もう片方が古いまま残る事故を防ぐ。
 *
 * useSearchParams を使うので、呼ぶ側で Suspense に包むこと。
 */
export function PostBoard({ slug }: { slug?: string }) {
  const params = useSearchParams();

  // URL に知らない値が入っていても落とさない。既定に倒す。
  const raw = params.get("sort");
  const sort: SortOrder = SORTS.includes(raw as SortOrder)
    ? (raw as SortOrder)
    : "popular";

  const parsed = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;

  const { user } = useAuth();

  // 「すべて」のキーを ["posts", "all", ...] にしない。
  // slug の制約（^[a-z0-9-]+$）では all というトピックも作れるので、
  // その日にキャッシュが混ざる。
  const { data, error, mutate } = useSWR(
    slug ? ["posts", slug, sort, page] : ["all-posts", sort, page],
    () => (slug ? api.posts(slug, sort, page) : api.allPosts(sort, page)),
    { keepPreviousData: true },
  );
  const posts = data?.items;

  // 見出しは読み上げ用。画面にはトピックのチップが並んでいて、
  // どこを見ているかは目で分かる。同じことを大きく書くと重なるだけになる。
  // キーは "topics" で TopicNav と同じなので、通信は増えない。
  const { data: topics } = useSWR("topics", () => api.topics());
  const heading = slug
    ? topics?.find((t) => t.slug === slug)?.name
    : "すべての投稿";

  const basePath = slug ? `/topics/${slug}` : "/posts";

  async function toggleLike(target: PostSummary) {
    if (!data) return;

    const next = {
      ...data,
      items: data.items.map((p) =>
        p.id === target.id
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
            }
          : p,
      ),
    };

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
      {heading && <h1 className="sr-only">{heading}</h1>}

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
          {page > 1
            ? "このページには投稿がありません。"
            : "まだ投稿がありません。最初の一歩をどうぞ。"}
        </p>
      )}

      {posts?.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          showTopic={!slug}
          canLike={Boolean(user)}
          onToggleLike={() => toggleLike(post)}
          onDelete={() => remove(post)}
        />
      ))}

      {data && (
        <Pagination basePath={basePath} sort={sort} page={page} hasNext={data.hasNext} />
      )}
    </main>
  );
}
