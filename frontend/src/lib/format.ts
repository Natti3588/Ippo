/**
 * 投稿日時を「9月12日」の形にする。
 *
 * 書式を自分で組み立てず Intl に渡すのは、月や日の並びが地域で違うため。
 * createdAt は UTC で届くので、Date に入れた時点で見ている人の時刻になる。
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
