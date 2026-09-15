import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  id: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  /** useForm の register(...) の戻り値をそのまま渡す */
  registration: UseFormRegisterReturn;
  /** この欄に対するエラー文。無ければ undefined */
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
      {/* htmlFor と id を結ぶ。ラベルを押したら入力欄に入る */}
      <label htmlFor={id} className="text-[17px] font-bold text-ink">
        {label}
      </label>

      {/*
        value と onChange を持たない。
        registration の中に name / onChange / onBlur / ref が入っており、
        値は DOM 側が持つ。だから1文字打っても React は再描画しない。
      */}
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        // メールアドレスとパスワードに赤い波線を出さない
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        // 読み上げに「この欄のエラーはこれ」と伝える
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
