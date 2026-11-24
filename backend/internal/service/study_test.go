package service

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestStudyDate(t *testing.T) {
	jst := time.FixedZone("JST", 9*60*60)

	// 期待値は日付だけなので、読みやすいヘルパーにする
	date := func(y int, m time.Month, d int) time.Time {
		return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	}

	tests := []struct {
		name string
		now  time.Time
		want time.Time
	}{
		{
			name: "日本時間の 0:00 は当日",
			now:  time.Date(2026, 11, 11, 0, 0, 0, 0, jst),
			want: date(2026, 11, 11),
		},
		{
			name: "日本時間の 0:30 は当日",
			now:  time.Date(2026, 11, 11, 0, 30, 0, 0, jst),
			want: date(2026, 11, 11),
		},
		{
			name: "日本時間の 23:59 は当日",
			now:  time.Date(2026, 11, 10, 23, 59, 0, 0, jst),
			want: date(2026, 11, 10),
		},
		{
			name: "年をまたぐ",
			now:  time.Date(2027, 1, 1, 0, 0, 0, 0, jst),
			want: date(2027, 1, 1),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := studyDate(tt.now.UTC())
			if !got.Equal(tt.want) {
				t.Errorf("studyDate(%v) = %v, want %v", tt.now, got, tt.want)
			}
		})
	}
}

func TestStreaks(t *testing.T) {
	// 期待値は日付だけなので、読みやすいヘルパーにする
	date := func(y int, m time.Month, d int) time.Time {
		return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	}

	tests := []struct {
		name          string
		today         time.Time
		studyDays     []time.Time
		currentStreak int32
		longestStreak int32
	}{
		{
			name:          "学習記録がない",
			today:         date(2026, 11, 11),
			studyDays:     nil,
			currentStreak: 0,
			longestStreak: 0,
		},
		{
			name:          "今日だけ",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 11)},
			currentStreak: 1,
			longestStreak: 1,
		},
		{
			name:          "昨日だけなら数は残る",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 10)},
			currentStreak: 1,
			longestStreak: 1,
		},
		{
			name:          "おとといだけなら 0 に戻る",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 9)},
			currentStreak: 0,
			longestStreak: 1,
		},
		{
			name:          "今日まで 3 日続く",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 11), date(2026, 11, 10), date(2026, 11, 9)},
			currentStreak: 3,
			longestStreak: 3,
		},
		{
			name:          "昨日まで 5 日続き、今日はまだ",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 10), date(2026, 11, 9), date(2026, 11, 8), date(2026, 11, 7), date(2026, 11, 6)},
			currentStreak: 5,
			longestStreak: 5,
		},
		{
			name:          "途中で途切れ、前の連続日数のほうが長い",
			today:         date(2026, 11, 11),
			studyDays:     []time.Time{date(2026, 11, 11), date(2026, 11, 10), date(2026, 11, 7), date(2026, 11, 6), date(2026, 11, 5), date(2026, 11, 4)},
			currentStreak: 2,
			longestStreak: 4,
		},
		{
			name:          "月をまたぐ",
			today:         date(2026, 11, 1),
			studyDays:     []time.Time{date(2026, 11, 1), date(2026, 10, 31), date(2026, 10, 30)},
			currentStreak: 3,
			longestStreak: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			current, longest := streaks(tt.studyDays, tt.today)
			if current != tt.currentStreak || longest != tt.longestStreak {
				t.Errorf("streaks(%v, %v) = %d, %d, want %d, %d", tt.studyDays, tt.today, current, longest, tt.currentStreak, tt.longestStreak)
			}
		})
	}
}

type fakeStudyRepository struct {
	StudyRepository
	savedOn time.Time
	saveErr error
	dates   []time.Time
	listed  bool
}

func (r *fakeStudyRepository) CreateStudyRecord(_ context.Context, _ string, studiedOn time.Time) error {
	r.savedOn = studiedOn
	return r.saveErr
}

func (r *fakeStudyRepository) ListStudyDates(_ context.Context, _ string) ([]time.Time, error) {
	r.listed = true
	return r.dates, nil
}

func TestRecord(t *testing.T) {
	date := func(y int, m time.Month, d int) time.Time {
		return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	}

	// 日本時間では 2026-11-11 の 0:30。本番の time.Now() と同じく UTC で渡す
	now := time.Date(2026, 11, 10, 15, 30, 0, 0, time.UTC)
	clock := func() time.Time { return now }

	t.Run("日本時間の日付で保存する", func(t *testing.T) {
		repo := &fakeStudyRepository{}
		svc := NewStudyService(repo, clock)

		if _, err := svc.Record(context.Background(), "user-id"); err != nil {
			t.Fatalf("Record が失敗した: %v", err)
		}

		want := date(2026, 11, 11)
		if !repo.savedOn.Equal(want) {
			t.Errorf("保存した日付 = %v, want %v", repo.savedOn, want)
		}
	})

	t.Run("記録のあとの値を返す", func(t *testing.T) {
		repo := &fakeStudyRepository{
			dates: []time.Time{date(2026, 11, 11), date(2026, 11, 10)},
		}
		svc := NewStudyService(repo, clock)

		summary, err := svc.Record(context.Background(), "user-id")
		if err != nil {
			t.Fatalf("Record が失敗した: %v", err)
		}

		if !summary.StudiedToday {
			t.Error("StudiedToday = false, want true")
		}
		if summary.CurrentStreak != 2 {
			t.Errorf("CurrentStreak = %d, want 2", summary.CurrentStreak)
		}
	})

	t.Run("保存に失敗したらエラーを返す", func(t *testing.T) {
		saveErr := errors.New("保存失敗")
		repo := &fakeStudyRepository{saveErr: saveErr}
		svc := NewStudyService(repo, clock)

		_, err := svc.Record(context.Background(), "user-id")

		// 包んで返してもよいが、元のエラーは辿れるようにする
		if !errors.Is(err, saveErr) {
			t.Fatalf("err = %v, want %v", err, saveErr)
		}
		// 保存できなかったのに、記録済みのような値を作らない
		if repo.listed {
			t.Error("保存に失敗したのに ListStudyDates を呼んでいる")
		}
	})
}
