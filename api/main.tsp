import "@typespec/http";

using Http;

@service(#{ title: "Ippo" })
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

@route("/topics")
namespace Topics {
  @doc("トピックの一覧を取得する")
  @get
  op list(): Topic[];

  @doc("トピックの投稿を、指定された並び順で取得する。 既定は人気順")
  @route("{slug}/posts")
  @get
  op listPosts(
    @path slug: string,
    @query sort?: SortOrder = SortOrder.popular,
  ): Post[] | NotFoundResponse;

  @doc("トピックに投稿する")
  @route("{slug}/posts")
  @post
  op createPost(@path slug: string, @body request: CreatePostRequest):
    | (CreatedResponse & Body<Post>)
    | NotFoundResponse;
}

@route("/posts")
namespace Posts {
  @doc("投稿にいいねをする")
  @route("{postId}/like")
  @put
  op like(@path postId: string): NoContentResponse | NotFoundResponse;

  @doc("いいねを取り消す")
  @route("{postId}/like")
  @delete
  op unlike(@path postId: string): NoContentResponse | NotFoundResponse;
}
