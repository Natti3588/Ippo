"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { flushSync } from "react-dom";
import { useFormContext } from "react-hook-form";
import { ApiError } from "@/lib/problem";
import { Counter } from "@/components/Counter";
import { Markdown } from "@/components/Markdown";
import { ImageDecodeError, uploadImage } from "@/lib/upload";

type Tab = "write" | "preview";

/** 投稿の作成と編集で共通の項目。 */
export type PostFields = {
  title: string;
  body: string;
};

/** 親（作成・編集のページ）から、タブを動かすための窓口。 */
export type PostEditorHandle = {
  /** 「書く」タブに戻す。送信が止まったとき、隠れた本文へフォーカスを移す前に呼ぶ。 */
  showWriteTab: () => void;
  /** タブとプレビューを最初の状態に戻す。下書きを消したときに呼ぶ。 */
  resetView: () => void;
};

/**
 * タイトルと本文の入力欄。作成と編集の両方で使う。
 *
 * 2つのページで同じ部品を使うのは、検証やプレビュー、画像の入れ方が
 * 片方だけ古いまま残るのを防ぐため。
 * react-hook-form の FormProvider の内側に置くこと。
 */
export function PostEditor({
  ref,
  onUploadingChange,
}: {
  ref?: Ref<PostEditorHandle>;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<PostFields>();

  const [tab, setTab] = useState<Tab>("write");
  const [previewBody, setPreviewBody] = useState("");
  const [previewHeight, setPreviewHeight] = useState<number>();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ write: null, preview: null });

  useImperativeHandle(ref, () => ({
    showWriteTab: () => flushSync(() => setTab("write")),
    resetView: () => {
      setPreviewBody("");
      setTab("write");
    },
  }));

  const bodyField = register("body", {
    required: "本文を入力してください",
    maxLength: { value: 15000, message: "本文は15000文字以内にしてください" },
  });

  // 「投稿する」「保存する」も、画像を送っている間は押せなくする。親に知らせる。
  function updateUploading(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
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

  // 本文のカーソルの位置に文字を入れる。選んでいた文字は置き換える。
  // プレビュー中なら「書く」に戻す。入った場所が見えないと、入ったかどうか分からない。
  function insertIntoBody(text: string) {
    const el = bodyRef.current;
    const body = getValues("body");
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;

    setValue("body", body.slice(0, start) + text + body.slice(end), {
      shouldDirty: true,
      shouldValidate: true,
    });
    flushSync(() => setTab("write"));

    const caret = start + text.length;
    el?.focus();
    el?.setSelectionRange(caret, caret);
  }

  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 空に戻しておかないと、同じファイルをもう一度選んだときに change が起きない
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    updateUploading(true);
    try {
      const path = await uploadImage(file);
      insertIntoBody(`![](${path})`);
    } catch (err) {
      setUploadError(uploadErrorMessage(err));
    } finally {
      updateUploading(false);
    }
  }

  return (
    <>
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
            placeholder="最近の英語の勉強で、うれしかったことや困ったことは…"
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

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-describedby={uploadError ? "upload-error" : undefined}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-ippo border border-border-strong bg-surface px-4 text-ui text-ink hover:bg-accent-soft transition-colors disabled:opacity-60"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
            </svg>
            {uploading ? "画像を送っています…" : "画像を入れる"}
          </button>
          {/* 押しても見えるのはブラウザのファイル選択だけ。input そのものは出さない */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickImage}
          />
          <p className="text-ui text-ink-soft">
            {"## 見出し　- 箇条書き　**太字**　`表現`　[文字](URL)　> 引用　![説明](URL)"}
          </p>
        </div>
        {uploadError && (
          <p id="upload-error" role="alert" className="whitespace-pre-line text-ui text-danger">
            {uploadError}
          </p>
        )}
        {errors.body && (
          <p id="body-error" className="text-ui text-danger">
            {errors.body.message}
          </p>
        )}
      </div>
    </>
  );
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof ImageDecodeError) return "この画像は読み込めませんでした";
  // 401 と 503 は、Go が返す説明（「ログインが必要です」「いまは画像を使えません」）をそのまま出す
  if (err instanceof ApiError) return err.detail;
  return "画像を送れませんでした。\nもう一度お試しください";
}
