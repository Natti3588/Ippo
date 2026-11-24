import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  /** register(...) が返したものを、そのまま渡す */
  registration: UseFormRegisterReturn;
  /** この欄のエラー文。無ければ undefined */
  error?: string;
  hint?: string;
};

export function Field({
  id, label, type, autoComplete, registration, error, hint,
}: Props) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-bold text-primary">
        {label}
      </label>

      {/* 値は DOM が持つ。1 文字打っても React は描き直さない */}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        // スペルチェックの赤い波線を止める。メールにもパスワードにも要らない
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        // 「この欄のエラーはこれ」を読み上げに伝える
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...registration}
        className={`w-full rounded-md border bg-surface p-3 text-base text-primary ${
          error ? "border-2 border-error" : "border-strong"
        }`}
      />

      {error ? (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
