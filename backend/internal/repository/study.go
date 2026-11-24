package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/database/sqlcgen"
	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/go-sql-driver/mysql"
)

type StudyRepository struct {
	q *sqlcgen.Queries
}

func NewStudyRepository(db *sql.DB) *StudyRepository {
	return &StudyRepository{q: sqlcgen.New(db)}
}

func (r *StudyRepository) CreateStudyRecord(ctx context.Context, userID string, studiedOn time.Time) error {
	uid, err := toBinaryUUID(userID)
	if err != nil {
		return err
	}

	if err := r.q.CreateStudyRecord(ctx, sqlcgen.CreateStudyRecordParams{UserID: uid, StudiedOn: studiedOn}); err != nil {
		if mysqlErr, ok := errors.AsType[*mysql.MySQLError](err); ok && mysqlErr.Number == mysqlErrNoReferencedRow {
			return fmt.Errorf("ユーザーが存在しません: %w", domain.ErrNotFound)
		}

		return err
	}

	return nil
}

func (r *StudyRepository) ListStudyDates(ctx context.Context, userID string) ([]time.Time, error) {
	uid, err := toBinaryUUID(userID)
	if err != nil {
		return nil, err
	}

	studyDates, err := r.q.ListStudyDatesByUser(ctx, uid)
	if err != nil {
		return nil, err
	}

	return studyDates, nil
}
