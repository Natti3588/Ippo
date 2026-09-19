import useSWR from "swr";
import { api } from "@/lib/api";

/**
 * 既定のトピックの掲示板への行き先。まだ取れていなければ null。
 *
 * 「掲示板へ行く」と書きたい場所がいくつかあるが、契約に掲示板という
 * 経路は無い。投稿一覧は必ずトピックに属するので、どれか1つを選ぶしかない。
 *
 * 1つ目を選ぶのは恣意的ではない。ListTopics は
 * ORDER BY display_order ASC で返すので、先頭が既定のトピックである。
 * その順番は DB が持っている。画面が slug を書き写すと、
 * 並び順を変えた日に画面だけ古い行き先を指す。
 *
 * キーは "topics" で TopicNav やホームと同じ。SWR が重複した取得を
 * 1回にまとめるので、呼ぶ場所が増えても通信は増えない。
 */
export function useBoardHref(): string | null {
  const { data } = useSWR("topics", () => api.topics());
  return data?.[0] ? `/topics/${data[0].slug}` : null;
}
