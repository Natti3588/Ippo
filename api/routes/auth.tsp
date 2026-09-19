using Http;

namespace Ippo;

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
