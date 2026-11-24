"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";

type FormValues = {
  displayName: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: { displayName: "" },
  });

  // defaultValues は初回しか見られないので、user が届いた時点で入れ直す
  useEffect(() => {
    if (user) {
      reset({ displayName: user.displayName });
    }
  }, [user, reset]);

  async function onSubmit(values: FormValues) {
    setFailure(null);
    setSaved(false);
    try {
      const updated = await api.updateDisplayName(values.displayName);
      // 返ってきた利用者をそのまま入れる。ヘッダーの表示名もその場で変わる
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.push("/");
    }
  }

  // 未ログインでは開けない。URL を直接叩けるので、この経路は必ず通る。
  if (user === null) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-5">
        <p className="mb-5 text-base text-primary">設定を開くにはログインが必要です。</p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center rounded-md bg-accent px-6 py-3 text-base font-bold text-on-accent hover:opacity-90 transition-colors"
        >
          ログイン
        </Link>
      </main>
    );
  }

  // 確かめている最中は何も出さない
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-14 md:px-5">
      <h1 className="pt-10 pb-2 text-2xl font-bold text-primary">設定</h1>

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-error bg-surface p-3.5">
          <p className="text-sm text-error">{failure}</p>
        </div>
      )}

      {/* role="status" で、保存できたことを読み上げでも伝える */}
      {saved && (
        <div role="status" className="mb-6 border-l-4 border-accent bg-surface p-3.5">
          <p className="text-sm text-accent">表示名を変えました</p>
        </div>
      )}

      <section className="border-t border-border py-6">
        <h2 className="mb-2 text-xl font-bold text-primary">メールアドレス</h2>
        <p className="mb-2 text-base text-primary">{user.email}</p>
        {/* 変更できないことを黙って隠さない。無いものは無いと書く */}
        <p className="text-sm text-secondary">メールアドレスは変更できません。</p>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="mb-2 text-xl font-bold text-primary">表示名</h2>

        {/* 投稿は名前を写し取っていないので、変えると過去の投稿の表示も変わる */}
        <p className="mb-4 max-w-[30em] text-sm text-secondary">
          投稿に表示される名前です。
          <br />
          変えると、これまでに書いた投稿の表示も
          <br />
          すべて新しい名前に変わります。
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <label htmlFor="displayName" className="text-sm font-bold text-primary">
            新しい表示名
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="nickname"
            aria-invalid={errors.displayName ? true : undefined}
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            {...register("displayName", {
              required: "表示名を入力してください",
              maxLength: { value: 50, message: "表示名は50文字以内にしてください" },
            })}
            className={`w-full rounded-md border bg-surface p-3 text-base text-primary ${
              errors.displayName ? "border-2 border-error" : "border-strong"
            }`}
          />
          {errors.displayName && (
            <p id="displayName-error" className="text-sm text-error">
              {errors.displayName.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center rounded-md bg-accent px-6 py-3 text-base font-bold text-on-accent disabled:opacity-60 enabled:hover:opacity-90 transition-colors"
            >
              {isSubmitting ? "保存中…" : "保存する"}
            </button>
          </div>
        </form>
      </section>

      <section className="border-t border-b border-border py-6">
        <h2 className="mb-4 text-xl font-bold text-primary">ログアウト</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex min-h-11 items-center rounded-md border border-strong bg-surface px-5 py-2.5 text-sm text-primary hover:bg-muted hover:border-accent transition-colors"
        >
          ログアウトする
        </button>
      </section>
    </main>
  );
}
