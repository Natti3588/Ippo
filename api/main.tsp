import "@typespec/http";

using Http;

@service(#{ title: "Ippo" })
namespace Ippo;

@doc("サインアップリクエスト")
model SignUpRequest {
  @doc("サインアップに使うメールアドレス")
  @format("email")
  email: string;

  @doc("サインアップに使うパスワード")
  @minLength(8)
  @maxLength(128)
  password: string;

  @doc("サインアップに使う名前")
  @minLength(1)
  @maxLength(50)
  displayName: string;
}

@doc("ログインリクエスト")
model LoginRequest {
  @doc("ログインに使うメールアドレス")
  @format("email")
  email: string;

  @doc("ログインに使われるパスワード")
  password: string;
}

@doc("ログイン中のユーザーの情報")
model CurrentUser {
  @doc("ログインに使うメールアドレス")
  @format("email")
  email: string;

  @doc("投稿に使われる名前")
  displayName: string;
}
@doc("ユーザー情報変更")
model UpdateProfileRequest {
  @doc("ユーザー情報変更に使われる名前")
  @minLength(1)
  @maxLength(50)
  displayName: string;
}

@route("/auth")
namespace Auth {
  @route("signup")
  @post
  op signup(@body request: SignUpRequest):
    | (CreatedResponse & Body<CurrentUser>)
    | ConflictResponse;

  @route("login")
  @post
  op login(@body request: LoginRequest): CurrentUser | UnauthorizedResponse;

  @route("logout")
  @post
  op logout(): NoContentResponse;
}

@route("/me")
namespace Me {
  @get op get(): CurrentUser | UnauthorizedResponse;

  @patch op update(@body request: UpdateProfileRequest):
    | CurrentUser
    | UnauthorizedResponse;
}

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
  ): Post[] | BadRequestResponse | NotFoundResponse;

  @doc("トピックに投稿する")
  @route("{slug}/posts")
  @post
  op createPost(@path slug: string, @body request: CreatePostRequest):
    | (CreatedResponse & Body<Post>)
    | BadRequestResponse
    | UnauthorizedResponse
    | NotFoundResponse;
}

@route("/posts")
namespace Posts {
  @doc("投稿にいいねをする")
  @route("{postId}/like")
  @put
  op like(@path postId: string):
    | NoContentResponse
    | UnauthorizedResponse
    | NotFoundResponse;

  @doc("いいねを取り消す")
  @route("{postId}/like")
  @delete
  op unlike(@path postId: string):
    | NoContentResponse
    | UnauthorizedResponse
    | NotFoundResponse;
}
