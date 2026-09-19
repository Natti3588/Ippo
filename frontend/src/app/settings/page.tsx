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

  // user は最初 undefined で、あとから届く。
  // defaultValues は初回しか見られないので、届いた時点で入れ直す。
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
      // 返ってきた利用者をそのまま入れる。GET /me は呼び直さない。
      // これでヘッダーの表示名もその場で変わる。
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
      <main className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p className="mb-5 text-preview text-ink">設定を開くにはログインが必要です。</p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
        >
          ログイン
        </Link>
      </main>
    );
  }

  // 確かめている最中は何も出さない
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      <h1 className="pt-10 pb-2 text-heading font-bold text-ink">設定</h1>

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      {/*
        保存できたことを知らせる。role="status" なので、
        画面を見ていない人にも読み上げで届く。
      */}
      {saved && (
        <div role="status" className="mb-6 border-l-4 border-accent bg-surface p-3.5">
          <p className="text-ui text-accent">表示名を変えました</p>
        </div>
      )}

      <section className="border-t border-border py-6">
        <h2 className="mb-2 text-subtitle font-bold text-ink">メールアドレス</h2>
        <p className="mb-2 text-preview text-ink">{user.email}</p>
        {/* 変更できないことを黙って隠さない。無いものは無いと書く */}
        <p className="text-ui text-ink-soft">メールアドレスは変更できません。</p>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="mb-2 text-subtitle font-bold text-ink">表示名</h2>

        {/*
          投稿は users を参照しているだけで、名前を写し取っていない。
          だから変えると過去の投稿の表示もすべて変わる。これは仕様。
        */}
        <p className="mb-4 max-w-[30em] text-ui text-ink-soft">
          投稿に表示される名前です。
          <br />
          変えると、これまでに書いた投稿の表示もすべて新しい名前に変わります。
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          <label htmlFor="displayName" className="text-ui font-bold text-ink">
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
            className={`w-full rounded-ippo border bg-surface p-3 text-preview text-ink ${
              errors.displayName ? "border-2 border-danger" : "border-border-strong"
            }`}
          />
          {errors.displayName && (
            <p id="displayName-error" className="text-ui text-danger">
              {errors.displayName.message}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface disabled:opacity-60 enabled:hover:bg-accent-strong enabled:active:bg-accent-deep transition-colors"
            >
              {isSubmitting ? "保存中…" : "保存する"}
            </button>
          </div>
        </form>
      </section>

      <section className="border-t border-b border-border py-6">
        <h2 className="mb-4 text-subtitle font-bold text-ink">ログアウト</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex min-h-11 items-center rounded-ippo border border-border-strong px-5 py-2.5 text-ui text-ink hover:bg-accent-soft hover:border-accent transition-colors"
        >
          ログアウトする
        </button>
      </section>
    </main>
  );
}
