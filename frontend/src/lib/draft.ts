/**
 * 投稿画面の書きかけを、ブラウザの localStorage に残す。
 *
 * キーは利用者ごとに分ける。共用のパソコンで、前に使った人の下書きが
 * 次の人の投稿画面に入らないようにするため。/me は id を返さないので、
 * ログインに使うメールアドレスで区別する。
 *
 * localStorage は、プライベートブラウズや容量の超過で例外を投げることがある。
 * 下書きは無くても投稿はできるので、失敗は黙って諦める。
 */

export type Draft = {
  topic: string;
  title: string;
  body: string;
};

function key(email: string) {
  return `ippo:draft:${email}`;
}

export function loadDraft(email: string): Draft | null {
  try {
    const raw = localStorage.getItem(key(email));
    if (!raw) return null;
    const d: unknown = JSON.parse(raw);
    // 手で書き換えられたり、形を変えたあとの古い値だったりしても落ちないようにする
    if (
      typeof d !== "object" || d === null ||
      !("topic" in d) || typeof d.topic !== "string" ||
      !("title" in d) || typeof d.title !== "string" ||
      !("body" in d) || typeof d.body !== "string"
    ) {
      return null;
    }
    return { topic: d.topic, title: d.title, body: d.body };
  } catch {
    return null;
  }
}

/** タイトルと本文がどちらも空なら、保存せずに消す。トピックだけでは残さない。 */
export function saveDraft(email: string, draft: Draft) {
  try {
    if (!draft.title.trim() && !draft.body.trim()) {
      localStorage.removeItem(key(email));
      return;
    }
    localStorage.setItem(key(email), JSON.stringify(draft));
  } catch {
    // 保存できなくても、画面の入力はそのまま残っている
  }
}

export function clearDraft(email: string) {
  try {
    localStorage.removeItem(key(email));
  } catch {
    // 消せなかったときは、次に開いたとき戻ってくるだけで済む
  }
}
