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
