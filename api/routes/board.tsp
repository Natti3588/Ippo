using Http;

namespace Ippo;

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
  ): PostSummary[] | BadRequestProblem | NotFoundProblem;

  @doc("トピックに投稿する")
  @route("{slug}/posts")
  @post
  op createPost(@path slug: string, @body request: CreatePostRequest):
    | (CreatedResponse & Body<Post>)
    | BadRequestProblem
    | UnauthorizedProblem
    | NotFoundProblem;
}

@route("/posts")
namespace Posts {
  @doc("投稿を1件取得する。本文は全文を返す")
  @route("{postId}")
  @get
  op get(@path postId: string): Post | NotFoundProblem;

  @doc("自分の投稿を削除する。いいねも一緒に消える")
  @route("{postId}")
  @delete
  op remove(@path postId: string):
    | NoContentResponse
    | UnauthorizedProblem
    | ForbiddenProblem
    | NotFoundProblem;

  @doc("投稿にいいねをする")
  @route("{postId}/like")
  @put
  op like(@path postId: string):
    | NoContentResponse
    | UnauthorizedProblem
    | NotFoundProblem;

  @doc("いいねを取り消す")
  @route("{postId}/like")
  @delete
  op unlike(@path postId: string):
    | NoContentResponse
    | UnauthorizedProblem;
}
