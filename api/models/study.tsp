using Http;

namespace Ippo;

@doc("学習の記録の状態")
model StudySummary {
  @doc("今日の学習記録があるかどうか")
  studiedToday: boolean;

  @doc("連続学習日数。 今日まだ学習記録がなくても、昨日が学習日なら数は残る")
  currentStreak: int32;

  @doc("最長連続学習日数")
  longestStreak: int32;
}
