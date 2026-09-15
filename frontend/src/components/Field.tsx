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
    <div className="flex flex-col gap-2.5">
      {/* htmlFor と id を結んでおくと、ラベルを押しただけで入力欄に入る */}
      <label htmlFor={id} className="text-[17px] font-bold text-ink">
        {label}
      </label>

      {/*
        value も onChange も持たせない。
        name / onChange / onBlur / ref は registration の中に入っている。
        値を持つのは DOM のほうなので、1文字打っても React は動かない。
      */}
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
        className={`w-full rounded-ippo border bg-surface p-4 text-[19px] text-ink ${
          error ? "border-2 border-danger" : "border-border-strong"
        }`}
      />

      {error ? (
        <p id={errorId} className="text-[17px] leading-relaxed text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[15px] leading-relaxed text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
