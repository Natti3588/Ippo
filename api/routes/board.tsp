using Http;

namespace Ippo;

@route("/topics")
namespace Topics {
  @doc("トピックの一覧を取得する")
  @get
  op list(): Topic[] | InternalServerErrorProblem;

  @doc("トピックの投稿を、指定された並び順で10件ずつ取得する。 既定は人気順の1ページ目")
  @route("{slug}/posts")
  @get
  @useAuth(NoAuth | SessionAuth)
  op listPosts(@path slug: string, ...ListPostsQuery):
    | PostPage
    | BadRequestProblem
    | NotFoundProblem
    | InternalServerErrorProblem;

  @doc("トピックに投稿する")
  @route("{slug}/posts")
  @post
  @useAuth(SessionAuth)
  op createPost(@path slug: string, @body request: CreatePostRequest):
    | (CreatedResponse & Body<Post>)
    | BadRequestProblem
    | UnauthorizedProblem
    | NotFoundProblem
    | InternalServerErrorProblem;
}

@route("/posts")
namespace Posts {
  @doc("すべてのトピックの投稿を、指定された並び順で10件ずつ取得する。 既定は人気順の1ページ目")
  @get
  @useAuth(NoAuth | SessionAuth)
  op list(...ListPostsQuery):
    | PostPage
    | BadRequestProblem
    | InternalServerErrorProblem;

  @doc("投稿を1件取得する。 本文は全文を返す")
  @route("{postId}")
  @get
  @useAuth(NoAuth | SessionAuth)
  op get(@path postId: uuid):
    | Post
    | NotFoundProblem
    | InternalServerErrorProblem;

  @doc("自分の投稿のタイトルと本文を書き換える。 いいねはそのまま残る")
  @route("{postId}")
  @put
  @useAuth(SessionAuth)
  op update(@path postId: uuid, @body request: UpdatePostRequest):
    | Post
    | BadRequestProblem
    | UnauthorizedProblem
    | ForbiddenProblem
    | NotFoundProblem
    | InternalServerErrorProblem;

  @doc("自分の投稿を削除する。 いいねも一緒に消える")
  @route("{postId}")
  @delete
  @useAuth(SessionAuth)
  op remove(@path postId: uuid):
    | NoContentResponse
    | UnauthorizedProblem
    | ForbiddenProblem
    | NotFoundProblem
    | InternalServerErrorProblem;

  @doc("投稿にいいねをする")
  @route("{postId}/like")
  @put
  @useAuth(SessionAuth)
  op like(@path postId: uuid):
    | NoContentResponse
    | UnauthorizedProblem
    | NotFoundProblem
    | InternalServerErrorProblem;

  @doc("いいねを取り消す")
  @route("{postId}/like")
  @delete
  @useAuth(SessionAuth)
  op unlike(@path postId: uuid):
    | NoContentResponse
    | UnauthorizedProblem
    | InternalServerErrorProblem;
}
