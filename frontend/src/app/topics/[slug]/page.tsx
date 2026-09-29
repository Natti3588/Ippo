import { Suspense } from "react";
import { PostBoard } from "@/components/PostBoard";

/**
 * トピックごとの投稿一覧。
 *
 * ページ自体はサーバーコンポーネントのままにして、操作が要る部分だけを
 * PostBoard（クライアント）に任せる。ページを "use client" にすると、
 * metadata も書けなくなる。
 */
export default async function TopicBoardPage({ params }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;

  // PostBoard は useSearchParams を使うので Suspense で包む。
  // 包まないとビルドが止まる。
  return (
    <Suspense>
      <PostBoard slug={slug} />
    </Suspense>
  );
}
