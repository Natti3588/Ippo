import { Suspense } from "react";
import { PostBoard } from "@/components/PostBoard";

/**
 * すべてのトピックの投稿一覧。
 *
 * トピックごとの一覧と同じ部品を、slug を渡さずに使う。
 */
export default function AllPostsPage() {
  // PostBoard は useSearchParams を使うので Suspense で包む。
  return (
    <Suspense>
      <PostBoard />
    </Suspense>
  );
}
