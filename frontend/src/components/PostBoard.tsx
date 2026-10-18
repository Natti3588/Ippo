"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { api, type PostSummary, type SortOrder } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { useAuth } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { TopicNav } from "@/components/TopicNav";
import { PostItem } from "@/components/PostItem";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";

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

  // ログインのあとに、並び順とページも含めて同じ場所へ戻すための道
  const pathname = usePathname();
  const query = params.toString();
  const here = query ? `${pathname}?${query}` : pathname;

  // ログインしていない人がいいねを押したときに開く
  const [askingLogin, setAskingLogin] = useState(false);

  // user が undefined の間（まだ確かめている最中）は何もしない。
  // ログインしている人に、ログインを促すポップアップを見せてしまう。
  function onLike(target: PostSummary) {
    if (user) {
      toggleLike(target);
    } else if (user === null) {
      setAskingLogin(true);
    }
  }

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

  // 削除するか確かめている投稿。null のときは確認のポップアップを閉じている。
  const [confirming, setConfirming] = useState<PostSummary | null>(null);
  const [removing, setRemoving] = useState(false);

  async function remove() {
    if (!confirming) return;

    setFailure(null);
    setRemoving(true);
    try {
      await api.deletePost(confirming.id);
      // 一覧から1件消えるだけだと、消えたのか、並びが変わって見えなくなったのか分からない
      showToast("投稿を削除しました");
      // いいねは外部キーの ON DELETE CASCADE で一緒に消える。ここで消す必要はない。
      await mutate();
    } catch (err) {
      // 他人の投稿は 403、未ログインは 401 が返る。detail をそのまま出す。
      setFailure(err instanceof ApiError ? err.detail : "削除に失敗しました");
    } finally {
      setRemoving(false);
      setConfirming(null);
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
          onToggleLike={() => onLike(post)}
          onDelete={() => setConfirming(post)}
        />
      ))}

      {data && (
        <Pagination basePath={basePath} sort={sort} page={page} hasNext={data.hasNext} />
      )}

      <ConfirmDialog
        open={confirming !== null}
        title="投稿を削除しますか？"
        confirmLabel="削除する"
        busyLabel="削除中…"
        busy={removing}
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      >
        {/* タイトルは最大100文字で、英語の長い単語も入る。枠からはみ出さないよう、どこでも折り返す */}
        <p className="wrap-anywhere">「{confirming?.title}」を削除します。</p>
        <p>削除すると、元に戻せません。</p>
      </ConfirmDialog>

      <LoginRequiredDialog
        open={askingLogin}
        title="いいねするにはログインが必要です"
        next={here}
        onClose={() => setAskingLogin(false)}
      >
        <p>ログインすると、役に立った投稿にいいねを付けられます。</p>
      </LoginRequiredDialog>
    </main>
  );
}
