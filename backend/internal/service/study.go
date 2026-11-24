package service

import (
	"context"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

var jst = time.FixedZone("JST", 9*60*60)

func studyDate(now time.Time) time.Time {
	t := now.In(jst)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func streaks(dates []time.Time, today time.Time) (current, longest int32) {
	if len(dates) == 0 {
		return 0, 0
	}

	run := int32(1)
	longest = 1

	// 最初の連の長さ。連続学習日数の候補になる
	var firstRun int32
	broken := false

	for i := 1; i < len(dates); i++ {
		// dates は新しい順なので、dates[i] の翌日が dates[i-1] なら続いている
		if dates[i].AddDate(0, 0, 1).Equal(dates[i-1]) {
			run++
		} else {
			if !broken {
				firstRun = run
				broken = true
			}
			run = 1
		}
		longest = max(longest, run)
	}

	// 一度も途切れなければ、全部が最初の連
	if !broken {
		firstRun = run
	}

	// 今日まだ記録がなくても、昨日が学習日なら数は残る
	yesterday := today.AddDate(0, 0, -1)
	if dates[0].Equal(today) || dates[0].Equal(yesterday) {
		current = firstRun
	}
	return current, longest
}

type StudyRepository interface {
	CreateStudyRecord(ctx context.Context, userID string, studiedOn time.Time) error
	ListStudyDates(ctx context.Context, userID string) ([]time.Time, error)
}

type StudyService struct {
	repo StudyRepository
	now  func() time.Time
}

func NewStudyService(repo StudyRepository, now func() time.Time) *StudyService {
	return &StudyService{repo: repo, now: now}
}

// Summary は今日の学習記録の有無と、連続学習日数と最長連続学習日数を返す。
func (s *StudyService) Summary(ctx context.Context, userID string) (domain.StudySummary, error) {
	return s.summaryOn(ctx, userID, studyDate(s.now()))
}

// Record は今日の学習記録を付けてから、Summary と同じ値を返す。
// 今日の日付は1回だけ求め、保存と集計で同じ日を使う。
func (s *StudyService) Record(ctx context.Context, userID string) (domain.StudySummary, error) {
	today := studyDate(s.now())
	if err := s.repo.CreateStudyRecord(ctx, userID, today); err != nil {
		return domain.StudySummary{}, err
	}
	return s.summaryOn(ctx, userID, today)
}

func (s *StudyService) summaryOn(ctx context.Context, userID string, today time.Time) (domain.StudySummary, error) {
	dates, err := s.repo.ListStudyDates(ctx, userID)
	if err != nil {
		return domain.StudySummary{}, err
	}
	current, longest := streaks(dates, today)
	return domain.StudySummary{
		StudiedToday:  len(dates) > 0 && dates[0].Equal(today),
		CurrentStreak: current,
		LongestStreak: longest,
	}, nil
}
