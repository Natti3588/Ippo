using Http;

namespace Ippo;

@route("/auth")
namespace Auth {
  @route("signup")
  @post
  op signup(@body request: SignUpRequest):
    | (CreatedResponse & Body<CurrentUser>)
    | BadRequestProblem
    | ConflictProblem
    | InternalServerErrorProblem;

  @route("login")
  @post
  op login(@body request: LoginRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem
    | InternalServerErrorProblem;

  @route("logout")
  @post
  op logout(): NoContentResponse | InternalServerErrorProblem;
}

@route("/me")
namespace Me {
  @get op get(): CurrentUser | UnauthorizedProblem | InternalServerErrorProblem;

  @patch op update(@body request: UpdateProfileRequest):
    | CurrentUser
    | BadRequestProblem
    | UnauthorizedProblem
    | InternalServerErrorProblem;
}
