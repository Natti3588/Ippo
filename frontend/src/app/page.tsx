"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function HomePage() {
  // トピックは静的に書かない。増えたときに直し忘れる。
  const { data: topics } = useSWR("topics", () => api.topics());

  // 先頭のトピックの最新1件。topics が取れるまでキーを null にして待たせる。
  // SWR はキーが null のあいだ通信しない。
  const first = topics?.[0];
  const { data: latest } = useSWR(
    first ? ["posts", first.slug, "newest"] : null,
    () => api.posts(first!.slug, "newest"),
  );
  const post = latest?.[0];

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      <section className="pt-14 pb-10">
        <h1 className="mb-5 text-display font-bold text-ink">
          はじめの一歩は、
          <br />
          今日でいい
        </h1>
        <p className="mb-7 max-w-[26em] text-preview text-ink-soft">
          英語を始めた人が、読んだ本や聞いた番組のことを書いていく掲示板です。
          <br />
          添削はありません。会費もありません。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface"
          >
            はじめる
          </Link>
          {/*
            未ログインでも投稿を全部読める。
            登録の前に中を見せられることが、このサービスの強み。
          */}
          <Link
            href={topics ? `/topics/${topics[0].slug}` : "/topics/study-method"}
            className="inline-flex min-h-12 items-center rounded-ippo border border-ink px-5 py-3 text-preview text-ink"
          >
            読むだけ見てみる
          </Link>
        </div>
      </section>

      {/*
        投稿が0件のときは、この節ごと出さない。空の枠を見せない。

        「きのう書かれたもの」とは書かない。出せるのは先頭のトピックの
        最新1件であって、全体の最新ではない。どのトピックのものかを
        明記すれば、書いてあることはすべて事実になる。
      */}
      {post && first && (
        <section className="pb-10">
          <div className="border-t-3 border-ink pt-6">
            <p className="mb-3 text-ui text-ink-soft">{first.name} の新しい投稿</p>

            <Link
              href={`/posts/${post.id}`}
              className="mb-3 block font-read text-title font-semibold text-ink"
            >
              {post.title}
            </Link>

            <p className="mb-4 max-w-[32em] font-read text-body text-ink">
              {post.bodyPreview}
            </p>

            <p className="text-ui text-ink-soft">
              {post.authorName}　{formatDate(post.createdAt)}
            </p>
          </div>
        </section>
      )}

      {/* 理由。箱に入れず、罫線だけで区切る */}
      <section className="pb-10">
        <div className="border-t border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">うまく書けなくていい</h2>
          <p className="max-w-[30em] text-ui text-ink-soft">
            添削も採点もありません。読んだ本、聞いた番組、続かなかった日のこと。そのまま書く場所です。
          </p>
        </div>
        <div className="border-t border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">読むだけでも続く</h2>
          <p className="max-w-[30em] text-ui text-ink-soft">
            登録しなくても全部読めます。同じところでつまずいた人が、先にいます。
          </p>
        </div>
        <div className="border-t border-b border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">お金がかかりません</h2>
          <p className="max-w-[30em] text-ui text-ink-soft">
            教材も月額もありません。必要なのは、書く時間だけです。
          </p>
        </div>
      </section>

      {/* 数を文字で書かない。トピックは後から増える */}
      <section className="pb-10">
        <h2 className="mb-2 text-subtitle font-bold text-ink">こんなトピックがあります</h2>
        {topics?.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className="flex min-h-11 items-center border-t border-border py-4 text-preview font-bold text-ink last:border-b"
          >
            {t.name}
          </Link>
        ))}
      </section>
    </main>
  );
}
