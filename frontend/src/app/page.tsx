"use client";

import Link from "next/link";
import useSWR from "swr";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { api } from "@/lib/api";
import { BOARD_HREF } from "@/lib/topics";
import { PageColumns } from "@/components/PageColumns";
import { StudyCard } from "@/components/StudyCard";

// STEP 2 の文は、新規登録の画面の欄（メールアドレス・表示名・パスワード）に合わせてある
const STEPS = [
  {
    title: "読む",
    body: ["登録しなくても、", "すべての投稿を読めます。"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "登録する",
    body: ["メールアドレスと表示名、", "パスワードを入れるだけ。"],
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
    body: ["うまく書けなくて大丈夫です。", "役に立った投稿には、", "いいねを付けられます。"],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
];

// ログインしているかどうかで中身を変えない。変えると、確認が終わるまで上の節を出せない
export default function HomePage() {
  // トピックは書き並べない。増えたときに直し忘れる
  const { data: topics } = useSWR("topics", () => api.topics());

  return (
    <PageColumns aside={<StudyCard />}>
      <div className="flex flex-col gap-6">
        <Card padding={6}>
          <section className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">
              はじめの Ippo は
              <br />
              今日でいい
            </h1>
            <p className="text-lg">「いつか英語を話したい」で止まっている人のための掲示板です。</p>
            <p className="text-secondary">
              英語が話せたら、選べるものが増えます。
              <br />
              その日までの勉強法や教材を、ここで教えあいます。
            </p>
            {/* 新規登録のボタンは置かない。登録の入口はヘッダーにある */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button label="掲示板を見る" variant="primary" href={BOARD_HREF} />
              <Button label="投稿する" variant="ghost" href="/posts/new" />
            </div>
          </section>
        </Card>

        <Card padding={6}>
          <section className="flex flex-col gap-5">
            <h2 className="text-xl font-bold">使い方</h2>
            <ol className="grid gap-5 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3 md:flex-col">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {step.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-secondary">STEP {i + 1}</p>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="text-sm text-secondary">
                      {step.body.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </Card>

        <Card padding={6}>
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-bold">トピック一覧</h2>
            <div>
              {topics?.map((t) => (
                <Link
                  key={t.slug}
                  href={`/topics/${t.slug}`}
                  className="flex items-center justify-between border-t border-border py-3 font-bold first:border-t-0 hover:text-secondary"
                >
                  {t.name}
                  <span aria-hidden="true" className="text-secondary">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </Card>
      </div>
    </PageColumns>
  );
}
