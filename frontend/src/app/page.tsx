"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useBoardHref } from "@/lib/topics";

export default function HomePage() {
  const { user } = useAuth();
  const boardHref = useBoardHref();

  // トピックは静的に書かない。増えたときに直し忘れる。
  const { data: topics } = useSWR("topics", () => api.topics());

  // 先頭のトピックの最新1件。topics が取れるまでキーを null にして待たせる。
  // SWR はキーが null のあいだ通信しない。
  const first = topics?.[0];
  const { data: latest } = useSWR(
    first ? ["posts", first.slug, "newest"] : null,
    () => api.posts(first!.slug, "newest"),
  );
  const post = latest?.items[0];

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
      {/*
        user が undefined のあいだは、どちらの顔も出さない。
        先に片方を出してから消すと、画面がちらつく。Header.tsx と同じ扱い。

        この節は画面の上端にあるので、出るまでのあいだ下の内容が上に詰まる。
        高さを先に確保する手もあるが、下の節も GET /topics を待っている以上、
        最初の一瞬が空なのはここだけの話ではない。
      */}
      {user && (
        <section className="pt-14 pb-10">
          <h1 className="text-display font-bold text-ink">
            おかえりなさい、{user.displayName}さん
          </h1>
        </section>
      )}

      {user === null && (
        <section className="pt-14 pb-10">
          <h1 className="mb-5 text-display font-bold text-ink">
            はじめの Ippo は
            <br />
            今日でいい
          </h1>
          {/*
            説明を2つに分ける。前半は「これが何か」なので、見出しと対等に読ませたい。
            後半は始める前の条件なので、一段落とす。

            大きさ・太さ・色を3つとも落とすと、説明文が注釈に見える。
            ここで落とすのは色だけにして、大きさは本文のままにしてある。
          */}
          <p className="mb-2 max-w-[26em] text-body text-ink">
            「いつか英語を話したい」で止まっている人のための掲示板です。
          </p>
          <p className="mb-8 max-w-[26em] text-ui text-ink-soft">
            英語が話せたら、選べるものが増えます。その日までの勉強法や教材を、ここで教えあいます。
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
            >
              はじめる
            </Link>
            {/*
              未ログインでも投稿を全部読める。
              登録の前に中を見せられることが、このサービスの強み。

              トピックが取れるまでは出さない。控えの slug を書くと、
              トピックの並びを変えた日に、この1箇所だけ古い行き先を指す。
            */}
            {boardHref && (
              <Link
                href={boardHref}
                className="inline-flex min-h-12 items-center gap-1.5 text-preview text-accent hover:text-ink transition-colors"
              >
                読むだけ見てみる
                {/*
                  枠線のボタンにしない。塗りと線のボタンが並ぶ形にすると、
                  ひかえめな選択肢が主ボタンと同じ重さに見える。
                  山かっこはトピックの一覧と同じもので、この先があることを示す。
                */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            )}
          </div>
        </section>
      )}

      {/*
        投稿が0件のときは、この節ごと出さない。空の枠を見せない。

        「きのう書かれたもの」とは書かない。出せるのは先頭のトピックの
        最新1件であって、全体の最新ではない。どのトピックのものかを
        明記すれば、書いてあることはすべて事実になる。
      */}
      {post && first && (
        /*
          上の3pxで始まり、下の罫線で閉じる。始まりの印だけ置くと、
          どこで終わったのか分からないまま次の見出しが来る。
          閉じたあとの間隔を広く取るのは、節の切れ目が
          節の中の間隔（見出しと一覧のあいだ16px）より
          はっきり広くないと、別の話が始まったと読めないため。
        */
        <section className="mb-12 border-b border-border pb-8">
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

      {/*
        3つの理由は、登録していない人を口説くための文面である。
        「登録しなくても全部読めます」を、登録した人に見せる意味がない。

        見た目は箱に入れず、罫線だけで区切る。
      */}
      {user === null && (
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
      )}

      {/*
        見出しは名詞にする。矢印の付いた行が並んでいれば一覧だと分かるので、
        見出しは何の一覧かだけを言えばよい。文章にすると、読み終えるまで
        何の節なのか分からない。設定画面の見出し（設定・表示名）とも揃う。

        数を文字で書かない。トピックは後から増える。
      */}
      <section className="pb-10">
        <h2 className="mb-4 text-subtitle font-bold text-ink">トピック一覧</h2>
        {topics?.map((t) => (
          <Link
            key={t.slug}
            href={`/topics/${t.slug}`}
            className="flex min-h-11 items-center justify-between gap-4 border-t border-border py-4 text-preview font-bold text-ink last:border-b hover:bg-accent-soft transition-colors"
          >
            {t.name}
            {/*
              行全体がリンクだが、名前が1つ置いてあるだけでは押せるものに見えない。
              右端の山かっこが「この先がある」ことを示す。
              文字の隣にあるので、読み上げからは外す。
            */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-ink-faint"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ))}
      </section>
    </main>
  );
}
