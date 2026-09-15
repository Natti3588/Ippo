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

/**
 * 投稿日時を「2026年9月12日 21:04」の形にする。
 *
 * 一覧は「9月12日」で足りるが、詳細は1件だけを見る画面なので年と時刻まで出す。
 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
