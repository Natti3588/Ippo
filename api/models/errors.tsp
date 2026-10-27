using Http;

namespace Ippo;

@doc("RFC 9457 の Problem Details")
model ProblemDetails {
  @doc("問題の種類を表すURI。 このAPIでは常に about:blank")
  type: string;

  @doc("HTTPステータスの標準の語句")
  title: string;

  @doc("HTTPステータスコード")
  status: int32;

  @doc("何が起きたかの説明")
  detail: string;
}

@doc("RFC 9457 の Problem Details を本文に持つエラーの応答")
model Problem<Status extends int32> {
  ...Response<Status>;
  ...Body<ProblemDetails>;
  @header contentType: "application/problem+json";
}

@doc("入力が不正")
model BadRequestProblem is Problem<400>;

@doc("認証が必要")
model UnauthorizedProblem is Problem<401>;

@doc("対象が存在しない")
model NotFoundProblem is Problem<404>;

@doc("権限が無い")
model ForbiddenProblem is Problem<403>;

@doc("既に存在する")
model ConflictProblem is Problem<409>;

@doc("いまは使えない")
model ServiceUnavailableProblem is Problem<503>;

@doc("サーバーで問題が起きた")
model InternalServerErrorProblem is Problem<500>;
