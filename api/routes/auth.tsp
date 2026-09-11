using Http;

namespace Ippo;

@route("/auth")
namespace Auth {
  @route("signup")
  @post
  op signup(@body request: SignUpRequest):
    | (CreatedResponse & Body<CurrentUser>)
    | BadRequestResponse
    | ConflictResponse;

  @route("login")
  @post
  op login(@body request: LoginRequest):
    | CurrentUser
    | BadRequestResponse
    | UnauthorizedResponse;

  @route("logout")
  @post
  op logout(): NoContentResponse;
}

@route("/me")
namespace Me {
  @get op get(): CurrentUser | UnauthorizedResponse;

  @patch op update(@body request: UpdateProfileRequest):
    | CurrentUser
    | BadRequestResponse
    | UnauthorizedResponse;
}
