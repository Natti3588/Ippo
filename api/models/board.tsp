namespace Ippo;

@doc("投稿を分類するカテゴリ")
model Topic {
  @doc("URLに使う識別子")
  slug: string;

  @doc("表示名")
  name: string;
}

@doc("トピックに書き込む投稿")
model Post {
  @format("uuid")
  id: string;

  @doc("タイトル")
  title: string;

  @doc("本文")
  body: string;

  @doc("投稿者の名前")
  authorName: string;

  @doc("いいねの数")
  likeCount: int32;

  @doc("自分がいいねを押したかどうか。未ログインなら false")
  likedByMe: boolean;

  @doc("自分の投稿かどうか。true のときだけ削除できる。未ログインなら false")
  isMine: boolean;

  @doc("投稿日時（UTC）")
  createdAt: utcDateTime;

  @doc("この投稿が属するトピック。詳細ページから一覧へ戻るために使う")
  topic: Topic;
}

@doc("一覧に並べる投稿。本文は先頭200文字までしか含まない")
model PostSummary {
  @format("uuid")
  id: string;

  @doc("タイトル。100文字に制限しているため、一覧でも全文を返す")
  title: string;

  @doc("本文の先頭200文字。truncated が true なら続きがある")
  bodyPreview: string;

  @doc("本文が200文字を超えて切り詰められたかどうか")
  truncated: boolean;

  @doc("投稿者の名前")
  authorName: string;

  @doc("いいねの数")
  likeCount: int32;

  @doc("自分がいいねを押したかどうか。未ログインなら false")
  likedByMe: boolean;

  @doc("自分の投稿かどうか。true のときだけ削除できる。未ログインなら false")
  isMine: boolean;

  @doc("投稿日時（UTC）")
  createdAt: utcDateTime;
}

@doc("投稿一覧の1ページ分。1ページは10件で固定")
model PostPage {
  @doc("このページの投稿。最大10件")
  items: PostSummary[];

  @doc("次のページがあるかどうか。総ページ数と総件数は返さない")
  hasNext: boolean;
}

@doc("投稿の作成リクエスト")
model CreatePostRequest {
  @minLength(1)
  @maxLength(100)
  title: string;

  @minLength(1)
  @maxLength(15000)
  body: string;
}

@doc("ソート順")
enum SortOrder {
  popular,
  newest,
  oldest,
}
