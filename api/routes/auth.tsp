using Http;

namespace Ippo;

@doc("入力が不正")
model BadRequestProblem {
  ...BadRequestResponse;
  ...Body<ProblemDetails>;

  @header contentType: "application/problem+json";
}

@doc("認証が必要")
model UnauthorizedProblem {
  ...UnauthorizedResponse;
  ...Body<ProblemDetails>;

  @header contentType: "application/problem+json";
}

@doc("対象が存在しない")
model NotFoundProblem {
  ...NotFoundResponse;
  ...Body<ProblemDetails>;

  @header contentType: "application/problem+json";
}

@doc("既に存在する")
model ConflictProblem {
  ...ConflictResponse;
  ...Body<ProblemDetails>;

  @header contentType: "application/problem+json";
}

@route("/auth")
namespace Auth {
  @route("signup")
  @post
  op signup(@body request: SignUpRequest):
    | (CreatedResponse & Body<CurrentUser>)
    | BadRequestProblem
    | ConflictProblem;

  @route("login")
  @post
  op login(@body request: LoginRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem;

  @route("logout")
  @post
  op logout(): NoContentResponse;
}

@route("/me")
namespace Me {
  @get op get(): CurrentUser | UnauthorizedProblem;

  @patch op update(@body request: UpdateProfileRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem;
}
