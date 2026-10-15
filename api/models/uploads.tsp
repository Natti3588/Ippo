using Http;

namespace Ippo;

@doc("画像を1枚送るための許可証")
model UploadTicket {
  @doc("画像を送る先。 S3 の URL")
  url: url;

  @doc("送るときにフォームへ一緒に入れる値。 署名と条件が入っている")
  fields: Record<string>;

  @doc("送ったあとに本文へ書く画像のパス。 例: /uploads/<id>.jpg")
  path: string;
}
