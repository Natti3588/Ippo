"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { Field } from "@/components/Field";

type FormValues = {
  email: string;
  password: string;
  displayName: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  // 画面全体の失敗(401など)はフォームの外の話なので、これだけ useState で持つ
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // 打っている最中は何も言わない。欄を離れたときに初めて出す
    mode: "onBlur",
    defaultValues: { email: "", password: "", displayName: "" },
  });

  async function onSubmit(values: FormValues) {
    setFailure(null);
    try {
      const user = await api.signup(values.email, values.password, values.displayName);
      // 返ってきた利用者をそのまま入れる。GET /me を呼び直さない
      setUser(user);
      router.push("/");
    } catch (err) {
      // detail はバックエンドが利用者向けに書いた日本語なので、そのまま出す
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[440px] px-4 py-16 md:px-8">
      <h1 className="mb-10 text-[32px] font-bold leading-snug text-ink">新規登録</h1>

      {/* 画面全体の失敗はフォームの前にまとめて出す。
          role="alert" で、表示された瞬間に読み上げられる */}
      {failure && (
        <div role="alert" className="mb-9 border-l-4 border-danger bg-surface p-5">
          <p className="text-[17px] leading-relaxed text-danger">{failure}</p>
        </div>
      )}

      {/* handleSubmit が preventDefault と値の収集をやる。
          エラーがあれば最初の欄に自動で焦点が移る(RHF の既定) */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        <Field
          id="email"
          label="メールアドレス"
          type="email"
          autoComplete="email"
          registration={register("email", {
            required: "メールアドレスを入力してください",
          })}
          error={errors.email?.message}
        />
        <Field
          id="displayName"
          label="表示名"
          type="text"
          autoComplete="nickname"
          registration={register("displayName", {
            required: "表示名を入力してください",
            maxLength: { value: 50, message: "表示名は50文字以内にしてください" },
          })}
          error={errors.displayName?.message}
          hint="投稿に表示される名前です。あとから変えられます"
        />
        <Field
          id="password"
          label="パスワード"
          type="password"
          autoComplete="new-password"
          registration={register("password", {
            required: "パスワードを入力してください",
            minLength: { value: 8, message: "パスワードは8文字以上にしてください" },
            // bcrypt は72バイトで切る。文字数ではなくバイト数で数える。
            // 日本語や絵文字を入れると、8文字でも72バイトを超えうる。
            validate: (v) =>
              new TextEncoder().encode(v).length <= 72 ||
              "パスワードが長すぎます。短くしてください",
          })}
          error={errors.password?.message}
          hint="8文字以上"
        />

        {/* disabled にするのは送信中だけ。
            入力の途中で押せなくすると、なぜ押せないか分からない */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-15 w-full rounded-ippo bg-accent p-4 text-[19px] font-bold text-surface disabled:opacity-60"
        >
          {isSubmitting ? "送信中…" : "新規登録"}
        </button>
      </form>

      <p className="mt-10 text-[17px] leading-loose text-ink-soft">
        すでに登録した方は{" "}
        <Link href="/login" className="font-bold text-accent underline underline-offset-4">
          ログイン
        </Link>
      </p>
    </main>
  );
}
