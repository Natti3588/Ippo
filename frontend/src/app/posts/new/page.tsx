"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useForm, type FieldErrors } from "react-hook-form";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { Counter } from "@/components/Counter";
import { Markdown } from "@/components/Markdown";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { BOARD_HREF } from "@/lib/topics";

type Tab = "write" | "preview";

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
  const [tab, setTab] = useState<Tab>("write");
  const [previewBody, setPreviewBody] = useState("");
  const [previewHeight, setPreviewHeight] = useState<number>();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ write: null, preview: null });

  // 来たときに ?topic= が付いていれば、そのトピックへ戻す。
  // 付いていなければ、すべての投稿の一覧へ。
  const fromTopic = params.get("topic");
  const backHref = fromTopic ? `/topics/${fromTopic}` : BOARD_HREF;

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setFocus,
    setValue,
    subscribe,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      // 掲示板から来たときは、そのトピックを選んだ状態にしておく
      topic: params.get("topic") ?? "",
      title: "",
      body: "",
    },
  });

  const bodyField = register("body", {
    required: "本文を入力してください",
    maxLength: { value: 15000, message: "本文は15000文字以内にしてください" },
  });

  const email = user?.email;

  // 開いたとき、下書きがあれば入れ直す。
  // setValue で入れるのは、入れた状態も「書きかけ」として扱い、
  // 閉じようとしたときの確認を出すため。
  const restored = useRef(false);
  useEffect(() => {
    if (!email || restored.current) return;
    restored.current = true;
    const draft = loadDraft(email);
    if (!draft) return;
    // 下書きにトピックが無ければ、?topic= で選んだものを残す
    if (draft.topic) setValue("topic", draft.topic, { shouldDirty: true });
    setValue("title", draft.title, { shouldDirty: true });
    setValue("body", draft.body, { shouldDirty: true });
  }, [email, setValue]);

  // 打つのが止まって1秒たったら保存する。
  // subscribe なら、値が変わっても画面は描き直されない。
  // 投稿に成功したら保存をやめ、下書きを消す。保存をやめるときに
  // 待っている分を書き出してから消すので、消した下書きが書き戻されない。
  const [posted, setPosted] = useState(false);
  useEffect(() => {
    if (!email || posted) return;
    const owner = email;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function save() {
      timer = undefined;
      saveDraft(owner, getValues());
    }
    // 1秒たつ前に画面を離れたときも、待たずに残す
    function flush() {
      if (timer === undefined) return;
      clearTimeout(timer);
      save();
    }

    const unsubscribe = subscribe({
      formState: { values: true },
      callback: () => {
        clearTimeout(timer);
        timer = setTimeout(save, 1000);
      },
    });
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [email, posted, subscribe, getValues]);

  useEffect(() => {
    if (posted && email) clearDraft(email);
  }, [posted, email]);

  // 「下書きを消す」は2回押しで消す。長い英文をうっかり失わないように、
  // 1回目は文字を変えるだけにして、3秒たったら元に戻す。
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  useEffect(() => {
    if (!confirmDiscard) return;
    const t = setTimeout(() => setConfirmDiscard(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDiscard]);

  function onDiscard() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    setConfirmDiscard(false);
    if (email) clearDraft(email);
    // defaultValues に戻す。?topic= で来ていれば、そのトピックは残る
    reset();
    setPreviewBody("");
    setTab("write");
  }

  async function onSubmit(values: FormValues) {
    setFailure(null);
    try {
      // トピックは本体ではなく URL に入る。
      // 選んだ slug から送信先を組み立てる。
      const post = await api.createPost(values.topic, values.title, values.body);
      setPosted(true);
      // 201 が Post を返す。その id で詳細へ送る。
      // 一覧へ戻すと、いま書いたものが人気順のどこにあるか分からない。
      router.push(`/posts/${post.id}`);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  // プレビューを開いた瞬間にだけ本文を読む。
  // useWatch で追うと、15,000文字の本文を1文字ごとに描き直すことになる。
  function selectTab(next: Tab) {
    // すでにプレビュー中なら textarea は隠れていて、高さが 0 と測れてしまう。
    if (next === "preview" && tab === "write") {
      setPreviewBody(getValues("body"));
      // textarea は利用者が高さを変えられるので、rows から決めた値だと食い違う。
      // 隠される前の、いま見えている高さをここで測って、プレビューに揃える。
      setPreviewHeight(bodyRef.current?.offsetHeight);
    }
    setTab(next);
  }

  function onTabKeyDown(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    // タブは2つだけなので、どちらの矢印でももう片方へ移る
    const next: Tab = tab === "write" ? "preview" : "write";
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  // 本文が空などで送信が止まったとき、プレビュー中なら書くタブへ戻す。
  // react-hook-form も最初のエラーへフォーカスを移そうとするが、
  // その時点では textarea が hidden のままなので効かない。
  // flushSync で描き直しを済ませてから、こちらでフォーカスを移す。
  // タイトルなど先に並ぶ項目にもエラーがあるときは、そちらへのフォーカスを奪わない。
  function onInvalid(errs: FieldErrors<FormValues>) {
    if (!errs.body) return;
    flushSync(() => setTab("write"));
    if (!errs.topic && !errs.title) setFocus("body");
  }

  // 書きかけのまま閉じようとしたら止める。
  // 送信中は止めない（これから消えるのが正しいため）。
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, isSubmitting]);

  // 未ログインでは書けない。ヘッダーにも「投稿する」を出していないが、
  // URL を直接開けるので、この経路は必ず通る。
  if (user === null) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p className="mb-5 text-preview text-ink">投稿するにはログインが必要です。</p>
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
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
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-ui text-ink-soft hover:text-ink transition-colors"
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

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex flex-col gap-5">
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
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ippo border border-border-strong bg-surface px-3.5 py-2.5 has-checked:border-2 has-checked:border-accent has-checked:bg-accent-soft hover:bg-accent-soft hover:border-accent transition-colors"
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
          <div
            role="tablist"
            aria-label="本文の表示"
            onKeyDown={onTabKeyDown}
            className="flex gap-1 border-b border-border"
          >
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                ref={(el) => {
                  tabRefs.current[t] = el;
                }}
                type="button"
                role="tab"
                id={`body-tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`body-panel-${t}`}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => selectTab(t)}
                className={`-mb-px flex min-h-11 items-center border-b-2 px-4 text-ui transition-colors ${
                  tab === t
                    ? "border-accent font-bold text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t === "write" ? "書く" : "プレビュー"}
              </button>
            ))}
          </div>

          {/*
            textarea は外さずに hidden で隠す。外すと、ブラウザが持っている
            取り消し（Ctrl+Z）の履歴とカーソルの位置が消える。
            textarea も register で繋ぐ。value / onChange は持たせない。
            15,000文字まで書けるので、1文字ごとに再描画させない。
          */}
          <div
            role="tabpanel"
            id="body-panel-write"
            aria-labelledby="body-tab-write"
            hidden={tab !== "write"}
          >
            <textarea
              id="body"
              rows={12}
              placeholder="やっと1冊終わりました。選んだのは…"
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={errors.body ? "body-error" : undefined}
              {...bodyField}
              ref={(el) => {
                bodyField.ref(el);
                bodyRef.current = el;
              }}
              className={`w-full resize-y rounded-ippo border bg-surface p-3.5 font-read text-body text-ink ${
                errors.body ? "border-2 border-danger" : "border-border-strong"
              }`}
            />
          </div>
          <div
            role="tabpanel"
            id="body-panel-preview"
            aria-labelledby="body-tab-preview"
            hidden={tab !== "preview"}
            tabIndex={0}
            style={{ height: previewHeight }}
            className="overflow-y-auto rounded-ippo border border-border-strong bg-surface p-3.5 font-read text-body text-ink wrap-anywhere"
          >
            {previewBody.trim() ? (
              <Markdown>{previewBody}</Markdown>
            ) : (
              <p className="text-ui text-ink-soft">プレビューする本文がありません</p>
            )}
          </div>

          <p className="text-ui text-ink-soft">
            {"## 見出し　- 箇条書き　**太字**　`表現`　[文字](URL)　> 引用　![説明](URL)"}
          </p>
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
            className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface disabled:opacity-60 enabled:hover:bg-accent-strong enabled:active:bg-accent-deep transition-colors"
          >
            {isSubmitting ? "送信中…" : "投稿する"}
          </button>
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center text-ui text-ink-soft underline underline-offset-4 hover:text-ink transition-colors"
          >
            やめる
          </Link>
          {isDirty && (
            <button
              type="button"
              onClick={onDiscard}
              className={`ml-auto inline-flex min-h-11 items-center text-ui underline underline-offset-4 transition-colors ${
                confirmDiscard ? "font-bold text-danger" : "text-ink-soft hover:text-ink"
              }`}
            >
              {confirmDiscard ? "もう一度押すと消えます" : "下書きを消す"}
            </button>
          )}
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
