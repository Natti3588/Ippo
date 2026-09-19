using Http;

namespace Ippo;

@doc("RFC 9457 の Problem Details")
model ProblemDetails {
  @doc("問題の種類を表すURI。このAPIでは常に about:blank")
  type: string;

  @doc("HTTPステータスの標準の語句")
  title: string;

  @doc("HTTPステータスコード")
  status: int32;

  @doc("何が起きたかの説明")
  detail: string;
}

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

@doc("権限が無い")
model ForbiddenProblem {
  ...ForbiddenResponse;
  ...Body<ProblemDetails>;
  @header contentType: "application/problem+json";
}

@doc("既に存在する")
model ConflictProblem {
  ...ConflictResponse;
  ...Body<ProblemDetails>;
  @header contentType: "application/problem+json";
}
