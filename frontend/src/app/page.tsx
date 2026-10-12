"use client";

import Link from "next/link";
import useSWR from "swr";
import { api } from "@/lib/api";
import { BOARD_HREF } from "@/lib/topics";

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
        <p className="mb-4 max-w-[26em] text-ui text-ink-soft">
          英語が話せたら、選べるものが増えます。
          <br />
          その日までの勉強法や教材を、ここで教えあいます。
        </p>
        {/*
          使い方。登録しなくてもできること（読む）と、
          登録するとできること（いいね、書く）を分けて書く。
          ログインしている人にも同じ文を出すので、頼む形ではなく説明の形にする。
        */}
        <p className="mb-8 max-w-[30em] text-ui text-ink-soft">
          気になるトピックを開くと、ほかの人の投稿を読めます。
          <br />
          登録すると、役に立った投稿にいいねを付けたり、自分の勉強法や教材を紹介したりできます。
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
        3つの理由。ログインしている人にも出す。
        出し分けると、上の節と同じく、確認が終わった瞬間に一覧が押し下げられる。

        見た目は箱に入れず、罫線だけで区切る。
      */}
      <section className="pb-10">
        <div className="border-t border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">うまく書けなくていい</h2>
          <p className="max-w-[36em] text-ui text-ink-soft">
            添削も採点もありません。
            <br />
            読んだ本や聞いた番組、続かなかった日のことを、思ったまま書いてください。
          </p>
        </div>
        <div className="border-t border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">読むだけでいい</h2>
          <p className="max-w-[36em] text-ui text-ink-soft">
            登録しなくても、投稿はすべて読めます。
            <br />
            同じところでつまずいた人も、ここに書いています。
          </p>
        </div>
        <div className="border-t border-b border-border py-6">
          <h2 className="mb-2 text-subtitle font-bold text-ink">お金をかけなくていい</h2>
          <p className="max-w-[36em] text-ui text-ink-soft">
            月額も登録料もありません。
            <br />
            無料の教材も、おすすめの教材も、実際に使った人が紹介しています。
          </p>
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
