"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { Field } from "@/components/Field";
import { AuthSwitchLink } from "@/components/AuthSwitchLink";
import { safeNextPath } from "@/lib/next-path";

type FormValues = {
  email: string;
  password: string;
  displayName: string;
};

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  // 401 のような画面全体の失敗はフォームの外の話。これだけ useState で持つ
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // 打っている最中は黙っている。欄を離れたときに初めて出す
    mode: "onBlur",
    defaultValues: { email: "", password: "", displayName: "" },
  });

  async function onSubmit(values: FormValues) {
    setFailure(null);
    try {
      const user = await api.signup(values.email, values.password, values.displayName);
      // 返ってきた利用者をそのまま入れる。GET /me は呼び直さない
      setUser(user);
      // ?next= があれば、ログインを求められた元のページへ戻す
      router.push(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    } catch (err) {
      // detail はバックエンドが利用者向けに書いた日本語。そのまま出す
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  return (
    <main className="mx-auto w-full max-w-[380px] px-4 py-10 md:px-5">
      <h1 className="mb-6 text-2xl font-bold text-primary">新規登録</h1>

      {/* 画面全体の失敗はフォームの前に出す。role="alert" で出た瞬間に読み上げる */}
      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-error bg-surface p-3.5">
          <p className="text-sm text-error">{failure}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
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
            validate: {
              minChars: (v) =>
                [...v].length >= 8 || "パスワードは8文字以上にしてください",
              // bcrypt は 72 バイトで切るので、文字数ではなくバイト数で見る
              maxBytes: (v) =>
                new TextEncoder().encode(v).length <= 72 ||
                "パスワードが長すぎます。短くしてください",
            },
          })}
          error={errors.password?.message}
          hint="8文字以上"
        />

        {/* disabled にするのは送信中だけ。
            入力の途中で押せなくすると、なぜ押せないのか分からない */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full rounded-md bg-accent p-3 text-base font-bold text-on-accent disabled:opacity-60 enabled:hover:opacity-90 transition-colors"
        >
          {isSubmitting ? "登録中…" : "新規登録"}
        </button>
      </form>

      <p className="mt-6 text-sm text-secondary">
        すでに登録した方は{" "}
        <AuthSwitchLink href="/login">ログイン</AuthSwitchLink>
      </p>
    </main>
  );
}
