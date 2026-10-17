"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { PostEditor, type PostEditorHandle } from "@/components/PostEditor";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft";
import { showToast } from "@/lib/toast";
import { BOARD_HREF } from "@/lib/topics";

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
  const editorRef = useRef<PostEditorHandle>(null);
  const [uploading, setUploading] = useState(false);

  // 来たときに ?topic= が付いていれば、そのトピックへ戻す。
  // 付いていなければ、すべての投稿の一覧へ。
  const fromTopic = params.get("topic");
  const backHref = fromTopic ? `/topics/${fromTopic}` : BOARD_HREF;

  const form = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      // 掲示板から来たときは、そのトピックを選んだ状態にしておく
      topic: params.get("topic") ?? "",
      title: "",
      body: "",
    },
  });
  const {
    register,
    handleSubmit,
    getValues,
    setFocus,
    setValue,
    subscribe,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form;

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
    // 日をまたいで開くと、何を書いていたか覚えていないことがある。
    // 入っている文が前に書いた下書きだと、開いてすぐ分かるようにする。
    showToast("下書きを復元しました");
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
    editorRef.current?.resetView();
  }

  async function onSubmit(values: FormValues) {
    setFailure(null);
    try {
      // トピックは本体ではなく URL に入る。
      // 選んだ slug から送信先を組み立てる。
      const post = await api.createPost(values.topic, values.title, values.body);
      setPosted(true);
      showToast("投稿に成功しました");
      // 201 が Post を返す。その id で詳細へ送る。
      // 一覧へ戻すと、いま書いたものが人気順のどこにあるか分からない。
      router.push(`/posts/${post.id}`);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  // 本文が空などで送信が止まったとき、プレビュー中なら書くタブへ戻す。
  // react-hook-form も最初のエラーへフォーカスを移そうとするが、
  // その時点では textarea が hidden のままなので効かない。
  // flushSync で描き直しを済ませてから、こちらでフォーカスを移す。
  // タイトルなど先に並ぶ項目にもエラーがあるときは、そちらへのフォーカスを奪わない。
  function onInvalid(errs: FieldErrors<FormValues>) {
    if (!errs.body) return;
    editorRef.current?.showWriteTab();
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
        英語学習についての疑問や体験、
        <br />
        ちょっとした気づきを共有してみましょう。
      </p>

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      <FormProvider {...form}>
      {/* handleSubmit は送信のときに呼ぶ。onInvalid が ref を読むので、描くときに渡すと lint が止める */}
      <form onSubmit={(e) => handleSubmit(onSubmit, onInvalid)(e)} noValidate className="flex flex-col gap-5">
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

        <PostEditor ref={editorRef} onUploadingChange={setUploading} />

        <div className="flex items-center gap-5 border-t border-border pt-5">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface disabled:opacity-60 enabled:hover:bg-accent-strong enabled:active:bg-accent-deep transition-colors"
          >
            {isSubmitting ? "投稿中…" : "投稿する"}
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
      </FormProvider>
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
