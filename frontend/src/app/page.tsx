"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { BOARD_HREF } from "@/lib/topics";

/*
  ホームの「使い方」。文はログインしているかどうかで変えない。
  STEP 2 の文は、新規登録の画面の欄（メールアドレス・表示名・パスワード）に合わせてある。
  説明は1文ずつに分け、文ごとに行を改める。
*/
const STEPS = [
  {
    title: "読む",
    body: ["登録しなくても、すべての投稿を読めます。"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "登録する",
    body: ["メールアドレスと表示名、パスワードを入れるだけ。", "お金はかかりません。"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        <path d="M19 8v6M16 11h6" />
      </svg>
    ),
  },
  {
    title: "書く・いいねする",
    body: ["うまく書けなくて大丈夫です。", "役に立った投稿には、いいねを付けられます。"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
];

/*
  ログインしているかどうかで中身を出し分けない。
  出し分けると、/me の確認が終わるまで上の節が出せず、
  出た瞬間に下の内容が押し下げられる。
  ここに置くのは、通信を待たずに描ける使い方の説明だけにする。
  通信を待つのは、いちばん下のトピック一覧だけ。
*/
export default function HomePage() {
  // トピックは静的に書かない。増えたときに直し忘れる。
  const { data: topics } = useSWR("topics", () => api.topics());

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 pb-14 md:px-5">
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
        <p className="mb-2 max-w-[30em] text-body text-ink">
          「いつか英語を話したい」で止まっている人のための掲示板です。
        </p>
        <p className="mb-8 max-w-[26em] text-ui text-ink-soft">
          英語が話せたら、選べるものが増えます。
          <br />
          その日までの勉強法や教材を、ここで教えあいます。
        </p>
        <div className="flex flex-wrap items-center gap-5">
          {/*
            新規登録へのボタンは置かない。ログインしている人も同じ画面を見るため。
            登録の入口はヘッダーにある。ログインしていない人が「投稿する」を押すと、
            投稿画面がログインへ案内する。
          */}
          <Link
            href={BOARD_HREF}
            className="inline-flex min-h-12 items-center rounded-ippo bg-accent px-6 py-3 text-preview font-bold text-surface hover:bg-accent-strong active:bg-accent-deep transition-colors"
          >
            掲示板を見る
          </Link>
          <Link
            href="/posts/new"
            className="inline-flex min-h-12 items-center gap-1.5 text-preview text-accent hover:text-ink transition-colors"
          >
            投稿する
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
        </div>
      </section>

      {/*
        使い方。実際に使う順に、読む → 登録する → 書く・いいねする と並べる。
        以前の「3つの理由」（読むだけでいい・お金をかけなくていい・うまく書けなくていい）は、
        それぞれのステップの説明に入れてある。

        PC では横に3つ、スマホでは縦に並べ、点線でつなぐ。
        点線は、PC の余白に描いている足あとの小道（Footprints.tsx）と同じ線にする。
      */}
      <section className="pb-10">
        <div className="border-t border-border pt-8">
          <h2 className="mb-6 text-subtitle font-bold text-ink">使い方</h2>
          <ol className="relative grid gap-6 md:grid-cols-3 md:gap-4">
            {/*
              アイコンの中心を通る点線。スマホでは左端を縦に、PC では上端を横に通す。
              PC で左右の 1/6 を空けるのは、両端のアイコンの中心から始めて終えるため。
            */}
            <span
              aria-hidden="true"
              className="absolute top-5 bottom-10 left-[19px] border-l-2 border-dotted border-border-strong md:right-[16.67%] md:bottom-auto md:left-[16.67%] md:border-t-2 md:border-l-0"
            />
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="relative grid grid-cols-[40px_1fr] gap-3 md:flex md:flex-col md:items-center md:gap-0 md:px-2 md:text-center"
              >
                {/*
                  地の色の輪で点線を切り、アイコンの裏を線が通って見えないようにする。
                */}
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent ring-[6px] ring-ground md:mb-3">
                  {step.icon}
                </span>
                <div>
                  <p className="text-ui font-bold tracking-wider text-accent">STEP {i + 1}</p>
                  <h3 className="mb-1.5 text-preview font-bold text-ink">{step.title}</h3>
                  <p className="text-ui text-ink-soft">
                    {step.body.map((sentence) => (
                      <span key={sentence} className="block">
                        {sentence}
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

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
