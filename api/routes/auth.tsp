using Http;

namespace Ippo;

@route("/auth")
namespace Auth {
  @summary("ユーザーを新規登録する")
  @doc("""
    登録に成功するとセッションを作り、 Cookie を発行する。
    メールアドレスが登録済みなら 409 を返す
    """)
  @route("signup")
  @post
  op signup(@body request: SignUpRequest):
    | (CreatedResponse & Body<CurrentUser>)
    | BadRequestProblem
    | ConflictProblem
    | InternalServerErrorProblem;

  @summary("ログインする")
  @doc("""
    ログインに成功するとセッションを作り、 Cookie を発行する。
    メールアドレスかパスワードが違うときは 401 を返す
    """)
  @route("login")
  @post
  op login(@body request: LoginRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem
    | InternalServerErrorProblem;

  @summary("ログアウトする")
  @doc("""
    セッションを削除する。
    ログインしていなくても 204 を返す
    """)
  @route("logout")
  @post
  @useAuth(NoAuth | SessionAuth)
  op logout(): NoContentResponse | InternalServerErrorProblem;
}

@route("/me")
namespace Me {
  @summary("ログイン中のユーザーを取得する")
  @get
  @useAuth(SessionAuth)
  op get(): CurrentUser | UnauthorizedProblem | InternalServerErrorProblem;

  @summary("ユーザーの表示名を変更する")
  @patch
  @useAuth(SessionAuth)
  op update(@body request: UpdateProfileRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem
    | InternalServerErrorProblem;
}
