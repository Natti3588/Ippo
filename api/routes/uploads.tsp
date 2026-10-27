using Http;

namespace Ippo;

@route("/uploads")
namespace Uploads {
  @summary("アップロードの許可証を発行する")
  @doc("""
    ユーザーが S3 へ直接アップロードするための署名付き POST の情報を返す。
    ファイルはこの API を通らない。
    アップロード先を使えないときは 503 を返す
    """)
  @post
  op create():
    | UploadTicket
    | UnauthorizedProblem
    | ServiceUnavailableProblem
    | InternalServerErrorProblem;
}
