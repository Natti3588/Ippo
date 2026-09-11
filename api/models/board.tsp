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

  @doc("本文")
  body: string;

  @doc("投稿者の名前")
  authorName: string;

  @doc("いいねの数")
  likeCount: int32;

  @doc("投稿日時（UTC）")
  createdAt: utcDateTime;
}

@doc("投稿の作成リクエスト")
model CreatePostRequest {
  @minLength(1)
  @maxLength(1000)
  body: string;
}

@doc("ソート順")
enum SortOrder {
  popular,
  newest,
  oldest,
}
