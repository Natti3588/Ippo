"use client";

import { useWatch, type Control, type FieldValues, type Path } from "react-hook-form";

// 入力中の文字数。useWatch をここに閉じ込め、1 文字ごとに描き直すのをこの数字だけにする
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

  // 絵文字でサーバーの CHAR_LENGTH() とずれないよう、[...str] で数える
  const count = typeof value === "string" ? [...value].length : 0;

  return (
    <span
      className={`text-sm tabular-nums ${count > max ? "text-error" : "text-secondary"}`}
    >
      {count.toLocaleString("ja-JP")} / {max.toLocaleString("ja-JP")}
    </span>
  );
}
