/**
 * ログインのあとに戻る先（?next=）を扱う。
 *
 * next は URL に入るので、誰でも書き換えられる。そのまま router.push すると、
 * 「Ippo のログイン画面」のリンクから外のサイトへ飛ばせてしまう（オープンリダイレクト）。
 * だから、このサイトの中の道だけを通し、それ以外はトップに倒す。
 */

// 比べるためだけの仮の起点。実際の通信には使わない。
const BASE = "http://ippo.invalid";

/**
 * next の値を、このサイトの中の道（/ から始まる）にして返す。
 * 使えない値ならトップ（/）を返す。
 *
 * 先頭の文字だけで判断しない。"//evil.com" や "/\evil.com"、
 * 間にタブを挟んだ "/\t/evil.com" も、ブラウザは外のサイトとして読む。
 * ブラウザと同じ URL の読み方をさせて、行き先の起点が変わらないかで決める。
 */
export function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/";
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

/** ログインか新規登録の画面へのリンクに、戻る先を付ける。 */
export function withNext(href: "/login" | "/signup", next: string | null): string {
  const path = safeNextPath(next);
  return path === "/" ? href : `${href}?next=${encodeURIComponent(path)}`;
}
