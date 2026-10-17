"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";
import { api, type Post } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/problem";
import { showToast } from "@/lib/toast";
import { BOARD_HREF } from "@/lib/topics";
import { PostEditor, type PostEditorHandle, type PostFields } from "@/components/PostEditor";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  // 詳細の画面と同じキー。詳細から来たときは、取り直さずにすぐ出せる。
  const { data: post, error } = useSWR(["post", id], () => api.post(id));

  // フォームに渡す投稿。開けると決まったら、そのあとは変えない。
  // SWR はタブに戻るたびに投稿とログインを取り直す。その1回が通信の失敗で落ちても、
  // フォームを外して書きかけを消さないため。保存のときの失敗は、フォームの上部に出る。
  const [opened, setOpened] = useState<Post | null>(null);
  if (opened === null && post !== undefined && user && post.isMine) {
    setOpened(post);
  }

  // 自分の投稿でなければ、詳細へ戻す。ボタンは出していないが、URL を直接開けるため。
  // 本当の確かめはサーバー（403）。ここは画面の案内だけで、開いたあとは見ない。
  const notMine = opened === null && (user === null || (post !== undefined && !post.isMine));
  useEffect(() => {
    if (notMine) router.replace(`/posts/${id}`);
  }, [notMine, id, router]);

  // 初期値は読み込めてから決まるので、フォームは中の部品に分ける。
  // 分けないと、useForm の defaultValues が空のまま固まる。
  if (opened) return <EditForm post={opened} />;

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10 md:px-5">
        <p role="alert" className="text-preview text-danger">
          {error instanceof ApiError ? error.detail : "読み込みに失敗しました"}
        </p>
        <p className="mt-5">
          <Link
            href={BOARD_HREF}
            className="text-ui text-accent underline underline-offset-4 hover:text-ink transition-colors"
          >
            掲示板にもどる
          </Link>
        </p>
      </main>
    );
  }

  // 読み込み中と、確かめている最中は何も出さない
  return null;
}

function EditForm({ post }: { post: Post }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef<PostEditorHandle>(null);
  const detailHref = `/posts/${post.id}`;

  const form = useForm<PostFields>({
    mode: "onBlur",
    defaultValues: { title: post.title, body: post.body },
  });
  const {
    handleSubmit,
    setFocus,
    formState: { isSubmitting, isDirty },
  } = form;

  async function onSubmit(values: PostFields) {
    setFailure(null);
    try {
      const updated = await api.updatePost(post.id, values.title, values.body);
      // 返ってきた Post で詳細のキャッシュを置き換える。
      // 取り直す通信を省き、戻った瞬間に新しい内容を出す。
      await mutate(["post", post.id], updated, { revalidate: false });
      showToast("投稿を更新しました");
      // replace で戻る。push だと、ブラウザの「戻る」で編集のページに戻ってしまう。
      router.replace(detailHref);
    } catch (err) {
      setFailure(err instanceof ApiError ? err.detail : "通信に失敗しました");
    }
  }

  // 本文が空などで送信が止まったとき、プレビュー中なら書くタブへ戻してからフォーカスを移す
  function onInvalid(errs: FieldErrors<PostFields>) {
    if (!errs.body) return;
    editorRef.current?.showWriteTab();
    if (!errs.title) setFocus("body");
  }

  // 書きかけのまま閉じようとしたら止める。保存中は止めない。
  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, isSubmitting]);

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      <nav className="py-4">
        <Link
          href={detailHref}
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
          投稿にもどる
        </Link>
      </nav>

      <h1 className="mb-7 text-heading font-bold text-ink">投稿を編集する</h1>

      {failure && (
        <div role="alert" className="mb-6 border-l-4 border-danger bg-surface p-3.5">
          <p className="text-ui text-danger">{failure}</p>
        </div>
      )}

      <FormProvider {...form}>
        {/* handleSubmit は送信のときに呼ぶ。onInvalid が ref を読むので、描くときに渡すと lint が止める */}
        <form
          onSubmit={(e) => handleSubmit(onSubmit, onInvalid)(e)}
          noValidate
          className="flex flex-col gap-5"
        >
          <PostEditor ref={editorRef} onUploadingChange={setUploading} />

          <div className="flex items-center gap-5 border-t border-border pt-5">
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface disabled:opacity-60 enabled:hover:bg-accent-strong enabled:active:bg-accent-deep transition-colors"
            >
              {isSubmitting ? "保存中…" : "保存する"}
            </button>
            <Link
              href={detailHref}
              className="inline-flex min-h-11 items-center text-ui text-ink-soft underline underline-offset-4 hover:text-ink transition-colors"
            >
              やめる
            </Link>
          </div>
        </form>
      </FormProvider>
    </main>
  );
}
