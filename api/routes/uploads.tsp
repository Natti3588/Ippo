using Http;

namespace Ippo;

@route("/uploads")
namespace Uploads {
  @post op create():
    | UploadTicket
    | UnauthorizedProblem
    | ServiceUnavailableProblem;
}
