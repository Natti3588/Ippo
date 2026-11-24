using Http;

namespace Ippo;

@route("/me/study")
namespace Study {
  @doc("今日の学習記録の有無と、連続学習日数と最長連続学習日数を取得する")
  @get
  @useAuth(SessionAuth)
  op get(): StudySummary | UnauthorizedProblem | InternalServerErrorProblem;

  @doc("今日の学習記録を付ける。 すでに付けていても成功し、同じ値を返す")
  @route("today")
  @put
  @useAuth(SessionAuth)
  op recordToday():
    | StudySummary
    | UnauthorizedProblem
    | InternalServerErrorProblem;
}
