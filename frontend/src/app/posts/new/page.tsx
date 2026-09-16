"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { Counter } from "@/components/Counter";

type FormValues = {
  topic: string;
  title: string;
  body: string;
};

function NewPost() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const { data: topics } = useSWR("topics", () => api.topics());
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      // 掲示板から来たときは、そのトピックを選んだ状態にしておく
      topic: params.get("topic") ?? "",
      title: "",
      body: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setFailure(null);
    try {
      // トピックは本体ではなく URL に入る。
      // 選んだ slug から送信先を組み立てる。
      const post = await api.createPost(values.topic, values.title, values.body);
      // 201 が Post を返す。その id で詳細へ送る。
      // 一覧へ戻すと、いま書いたものが人気順のどこにあるか分からない。
      router.push(`/posts/${post.id}`);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  // 未ログインでは書けない。ヘッダーにも「投稿する」を出していないが、
  // URL を直接開けるので、この経路は必ず通る。
  if (user === null) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p className="mb-5 text-preview text-ink">投稿するにはログインが必要です。</p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface"
        >
          ログイン
        </Link>
      </main>
    );
  }

  // user が undefined のあいだ（確かめている最中）は何も出さない
  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      <nav className="py-4">
        <Link
          href="/topics/study-method"
          className="inline-flex min-h-11 items-center gap-2 text-ui text-ink-soft"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          掲示板にもどる
        </Link>
      </nav>

      <h1 className="mb-2 text-heading font-bold text-ink">投稿する</h1>
      <p className="mb-7 max-w-[30em] text-ui text-ink-soft">
        読んだ本、聞いた番組、続かなかった日のこと。うまく書けなくて大丈夫です。
      </p>

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {/*
          トピックの選択。掲示板の中にフォームがあったときは、
          画面の slug がそのまま投稿先だった。独立するとその前提が消える。
        */}
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-3 p-0 text-ui font-bold text-ink">
            どのトピックに書きますか
          </legend>

          <div className="flex flex-col gap-2">
            {topics?.map((t) => (
              // label で input を包むと、行のどこを押しても選べる。
              // 文字だけが当たり判定になるのを避ける。
              <label
                key={t.slug}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ippo border border-border-strong bg-surface px-3.5 py-2.5 has-checked:border-2 has-checked:border-accent has-checked:bg-accent-soft"
              >
                <input
                  type="radio"
                  value={t.slug}
                  {...register("topic", { required: "トピックを選んでください" })}
                  className="h-5 w-5 accent-accent"
                />
                <span className="text-preview text-ink">{t.name}</span>
              </label>
            ))}
          </div>

          {errors.topic && (
            <p className="mt-2 text-ui text-danger">{errors.topic.message}</p>
          )}
        </fieldset>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="title" className="text-ui font-bold text-ink">
              タイトル
            </label>
            <Counter control={control} name="title" max={100} />
          </div>
          <input
            id="title"
            type="text"
            autoComplete="off"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "title-error" : undefined}
            {...register("title", {
              required: "タイトルを入力してください",
              maxLength: { value: 100, message: "タイトルは100文字以内にしてください" },
            })}
            className={`w-full rounded-ippo border bg-surface p-3 text-preview text-ink ${
              errors.title ? "border-2 border-danger" : "border-border-strong"
            }`}
          />
          {errors.title && (
            <p id="title-error" className="text-ui text-danger">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="body" className="text-ui font-bold text-ink">
              本文
            </label>
            <Counter control={control} name="body" max={15000} />
          </div>
          {/*
            textarea も register で繋ぐ。value / onChange は持たせない。
            15,000文字まで書けるので、1文字ごとに再描画させない。
          */}
          <textarea
            id="body"
            rows={12}
            placeholder="やっと1冊終わりました。選んだのは…"
            aria-invalid={errors.body ? true : undefined}
            aria-describedby={errors.body ? "body-error" : undefined}
            {...register("body", {
              required: "本文を入力してください",
              maxLength: { value: 15000, message: "本文は15000文字以内にしてください" },
            })}
            className={`w-full rounded-ippo border bg-surface p-3.5 font-read text-body text-ink ${
              errors.body ? "border-2 border-danger" : "border-border-strong"
            }`}
          />
          {errors.body && (
            <p id="body-error" className="text-ui text-danger">
              {errors.body.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface disabled:opacity-60"
          >
            {isSubmitting ? "送信中…" : "投稿する"}
          </button>
          <Link
            href="/topics/study-method"
            className="inline-flex min-h-11 items-center text-ui text-ink-soft underline underline-offset-4"
          >
            やめる
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function NewPostPage() {
  // useSearchParams を使うコンポーネントは Suspense の中に置く
  return (
    <Suspense>
      <NewPost />
    </Suspense>
  );
}
