import { useSyncExternalStore } from "react";

/**
 * 画面の下に短く出す知らせ。
 *
 * 投稿したあとは詳細画面へ移るので、投稿画面の state に持たせると移った時点で消える。
 * レイアウトはページを移っても残るので、表示はレイアウトに置いた <Toast /> が受け持ち、
 * ここでは「いま出すもの」だけをモジュールの変数に持つ。
 *
 * id は、同じ文を続けて出したときに、表示を消す時間を数え直すために使う。
 */

export type ToastMessage = { id: number; text: string };

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function showToast(text: string) {
  current = { id: nextId++, text };
  emit();
}

export function hideToast(id: number) {
  // 消す前に次の知らせが出ていたら、そちらは消さない
  if (current?.id !== id) return;
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
