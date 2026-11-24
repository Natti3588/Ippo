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

// 投稿の作成と編集で共通の項目
export type PostFields = {
  title: string;
  body: string;
};

// 親のページからタブを動かすための窓口
export type PostEditorHandle = {
  // 「書く」タブに戻す。送信が止まったとき、隠れた本文へフォーカスを移す前に呼ぶ
  showWriteTab: () => void;
  // タブとプレビューを最初の状態に戻す。下書きを消したときに呼ぶ
  resetView: () => void;
};

// タイトルと本文の入力欄。作成と編集の両方で使い、FormProvider の内側に置く
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

  // プレビューを開いた瞬間にだけ本文を読む。1 文字ごとに描き直さないため
  function selectTab(next: Tab) {
    if (next === "preview" && tab === "write") {
      setPreviewBody(getValues("body"));
      // 隠れる前の textarea の高さに、プレビューの高さをそろえる
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

  // 本文のカーソルの位置に文字を入れる。入った場所が見えるよう「書く」に戻す
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
          <label htmlFor="title" className="text-sm font-bold text-primary">
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
          className={`w-full rounded-md border bg-surface p-3 text-base text-primary ${
            errors.title ? "border-2 border-error" : "border-strong"
          }`}
        />
        {errors.title && (
          <p id="title-error" className="text-sm text-error">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="body" className="text-sm font-bold text-primary">
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
              className={`-mb-px flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors ${
                tab === t
                  ? "border-accent font-bold text-primary"
                  : "border-transparent text-secondary hover:text-primary"
              }`}
            >
              {t === "write" ? "書く" : "プレビュー"}
            </button>
          ))}
        </div>

        {/* 外さずに hidden で隠す。外すと取り消し（Ctrl+Z）の履歴とカーソルの位置が消える */}
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
            className={`w-full resize-y rounded-md border bg-surface p-3.5 text-base text-primary ${
              errors.body ? "border-2 border-error" : "border-strong"
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
          className="overflow-y-auto rounded-md border border-strong bg-surface p-3.5 text-base text-primary wrap-anywhere"
        >
          {previewBody.trim() ? (
            <Markdown>{previewBody}</Markdown>
          ) : (
            <p className="text-sm text-secondary">プレビューする本文がありません</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-describedby={uploadError ? "upload-error" : undefined}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-strong bg-surface px-4 text-sm text-primary hover:bg-muted transition-colors disabled:opacity-60"
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
          <p className="text-sm text-secondary">
            {"## 見出し　- 箇条書き　**太字**　`表現`　[文字](URL)　> 引用　![説明](URL)"}
          </p>
        </div>
        {uploadError && (
          <p id="upload-error" role="alert" className="whitespace-pre-line text-sm text-error">
            {uploadError}
          </p>
        )}
        {errors.body && (
          <p id="body-error" className="text-sm text-error">
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
