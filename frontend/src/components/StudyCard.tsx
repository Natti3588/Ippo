"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { withNext } from "@/lib/next-path";
import { showToast } from "@/lib/toast";

export const STUDY_KEY = "/me/study";

// /study ではページの見出しになるので 1、右の列では 2 にする
export function StudyCard({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const { user } = useAuth();
  // ログインしているときだけ読む。キーが null なら SWR は通信しない
  const { data: summary, error, mutate } = useSWR(user ? STUDY_KEY : null, () => api.study());
  const [recording, setRecording] = useState(false);

  async function record() {
    setRecording(true);
    try {
      // 返ってきた値をそのまま手元に入れる。読み直しはしない
      const next = await api.recordStudy();
      await mutate(next, { revalidate: false });
    } catch {
      showToast("学習記録を付けられませんでした");
    } finally {
      setRecording(false);
    }
  }

  return (
    <Card padding={4}>
      <div className="flex flex-col gap-3">
        <Heading level={headingLevel}>学習の記録</Heading>
        {user === null ? (
          <>
            <Text>学習記録を付けるにはログインが必要です</Text>
            <Button label="ログイン" href={withNext("/login", "/study")} variant="primary" />
          </>
        ) : error ? (
          <Text>学習記録を読み込めませんでした</Text>
        ) : !summary ? (
          <Skeleton height={120} />
        ) : (
          <>
            <div className="flex flex-col">
              <Text color="secondary">連続学習日数</Text>
              <Text size="3xl" weight="bold">{`${summary.currentStreak} 日`}</Text>
            </div>
            <Text color="secondary">{`最長 ${summary.longestStreak} 日`}</Text>
            {summary.studiedToday ? (
              <Button label="今日の学習記録は付けました" isDisabled />
            ) : (
              <Button label="今日学習した" variant="primary" isLoading={recording} onClick={record} />
            )}
          </>
        )}
      </div>
    </Card>
  );
}
