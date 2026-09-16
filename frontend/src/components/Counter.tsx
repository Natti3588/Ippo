"use client";

import { useWatch, type Control, type FieldValues, type Path } from "react-hook-form";

/**
 * 入力中の文字数を出す。
 *
 * useWatch をこの小さなコンポーネントの中だけで呼ぶのが肝。
 * 親で watch() を呼ぶと、1文字打つたびに画面全体が描き直される。
 * ここに閉じ込めれば、描き直されるのはこの数字だけで済む。
 */
export function Counter<T extends FieldValues>({
  control,
  name,
  max,
}: {
  control: Control<T>;
  name: Path<T>;
  max: number;
}) {
  const value = useWatch({ control, name });

  // [...str].length で数える。str.length は UTF-16 のコード単位を数えるので、
  // 絵文字を含むとサーバーの CHAR_LENGTH() とずれる。
  const count = typeof value === "string" ? [...value].length : 0;

  return (
    <span
      className={`text-ui tabular-nums ${count > max ? "text-danger" : "text-ink-soft"}`}
    >
      {count.toLocaleString("ja-JP")} / {max.toLocaleString("ja-JP")}
    </span>
  );
}
