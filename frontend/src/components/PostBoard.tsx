"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card } from "@astryxdesign/core/Card";
import { api, type PostSummary, type SortOrder } from "@/lib/api";
import { ApiError } from "@/lib/problem";
import { useAuth } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { TopicNav } from "@/components/TopicNav";
import { PostItem } from "@/components/PostItem";
import { Pagination } from "@/components/Pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoginRequiredDialog } from "@/components/LoginRequiredDialog";
import { PageColumns } from "@/components/PageColumns";
import { StudyCard } from "@/components/StudyCard";

const SORTS: SortOrder[] = ["popular", "newest", "oldest"];

// 投稿の一覧。slug があればそのトピック、なければすべてのトピック。
// useSearchParams を使うので、呼ぶ側で Suspense に包む
export function PostBoard({ slug }: { slug?: string }) {
  const params = useSearchParams();

  // URL に知らない値が入っていたら既定に戻す
  const raw = params.get("sort");
  const sort: SortOrder = SORTS.includes(raw as SortOrder) ? (raw as SortOrder) : "popular";

  const parsed = Number.parseInt(params.get("page") ?? "", 10);
  const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;

  const { user } = useAuth();

  // 「すべて」のキーを "posts" と分けておく。all という slug のトピックと混ざらないように
  const { data, error, mutate } = useSWR(
    slug ? ["posts", slug, sort, page] : ["all-posts", sort, page],
    () => (slug ? api.posts(slug, sort, page) : api.allPosts(sort, page)),
    { keepPreviousData: true },
  );
  const posts = data?.items;

  // 見出しは読み上げ用。どのトピックかはタブで見える
  const { data: topics } = useSWR("topics", () => api.topics());
  const heading = slug ? topics?.find((t) => t.slug === slug)?.name : "すべての投稿";

  const basePath = slug ? `/topics/${slug}` : "/posts";

  // ログインのあとに、並び順とページも含めて同じ場所へ戻す
  const pathname = usePathname();
  const query = params.toString();
  const here = query ? `${pathname}?${query}` : pathname;

  const [askingLogin, setAskingLogin] = useState(false);

  // ログインを確かめている途中（undefined）は何もしない
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
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
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
          return next;
        },
        // 成功しても読み直さない。人気順だと、見ている最中に並びが変わってしまう
        { optimisticData: next, rollbackOnError: true, revalidate: false },
      );
    } catch {
      // 数は rollbackOnError が戻す
    }
  }

  const [failure, setFailure] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PostSummary | null>(null);
  const [removing, setRemoving] = useState(false);

  async function remove() {
    if (!confirming) return;

    setFailure(null);
    setRemoving(true);
    try {
      await api.deletePost(confirming.id);
      showToast("投稿を削除しました");
      await mutate();
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "削除に失敗しました");
    } finally {
      setRemoving(false);
      setConfirming(null);
    }
  }

  return (
    <PageColumns aside={<StudyCard />}>
      {heading && <h1 className="sr-only">{heading}</h1>}

      <div className="flex flex-col gap-4">
        <TopicNav slug={slug} sort={sort} />

        {error && (
          <p role="alert" className="text-error">
            {error instanceof ApiError ? error.detail : "読み込みに失敗しました"}
          </p>
        )}

        {failure && (
          <p role="alert" className="text-error">
            {failure}
          </p>
        )}

        {posts && (
          <Card padding={5}>
            {posts.length === 0 ? (
              <p className="text-secondary">
                {page > 1 ? "このページには投稿がありません。" : "まだ投稿がありません。最初の一歩をどうぞ。"}
              </p>
            ) : (
              posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  showTopic={!slug}
                  onToggleLike={() => onLike(post)}
                  onDelete={() => setConfirming(post)}
                />
              ))
            )}
          </Card>
        )}

        {data && <Pagination basePath={basePath} sort={sort} page={page} hasNext={data.hasNext} />}
      </div>

      <ConfirmDialog
        open={confirming !== null}
        title="投稿を削除しますか？"
        confirmLabel="削除する"
        busyLabel="削除中…"
        busy={removing}
        onConfirm={remove}
        onCancel={() => setConfirming(null)}
      >
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
    </PageColumns>
  );
}
