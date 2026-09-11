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
	"github.com/google/uuid"
)

// mysqlErrDupEntry は一意制約違反を表す MySQL のエラー番号（ER_DUP_ENTRY）。
const mysqlErrDupEntry = 1062

type AuthRepository struct {
	q *sqlcgen.Queries
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{q: sqlcgen.New(db)}
}

// CreateUser は利用者を作成し、採番した ID を含む利用者を返す。
// MySQL に RETURNING が無いため、ID は INSERT の前に Go 側で生成する。
func (r *AuthRepository) CreateUser(ctx context.Context, u domain.User) (domain.User, error) {
	id := uuid.New()
	b, err := id.MarshalBinary()
	if err != nil {
		return domain.User{}, fmt.Errorf("UUIDのバイト列化に失敗: %w", err)
	}

	err = r.q.CreateUser(ctx, sqlcgen.CreateUserParams{
		ID:           b,
		DisplayName:  u.DisplayName,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
	})
	if err != nil {
		// 1062 は「どれかの一意制約に違反した」としか言わない。
		// users の一意制約は email と主キーだけで、主キーは UUIDv4 なので
		// 衝突は起きないと見なし、email の重複と断定している。
		// users に別の UNIQUE を足したら、この判定は見直すこと。
		if mysqlErr, ok := errors.AsType[*mysql.MySQLError](err); ok && mysqlErr.Number == mysqlErrDupEntry {
			return domain.User{}, fmt.Errorf("メールアドレスの重複: %w", domain.ErrEmailTaken)
		}
		return domain.User{}, err
	}

	u.Id = id.String()
	return u, nil
}

func (r *AuthRepository) FindUserByEmail(ctx context.Context, email string) (domain.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		// メールアドレスをエラーに埋め込まない。
		// ログイン失敗のたびに出る、値を攻撃者が制御できる経路のため。
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, domain.ErrNotFound
		}
		return domain.User{}, err
	}
	return toDomainUser(row)
}

func (r *AuthRepository) UpdateDisplayName(ctx context.Context, userID, displayName string) error {
	id, err := toBinaryUUID(userID)
	if err != nil {
		return err
	}
	return r.q.UpdateUserDisplayName(ctx, sqlcgen.UpdateUserDisplayNameParams{
		DisplayName: displayName,
		ID:          id,
	})
}

// CreateSession は hashedID でセッションを作成する。
// hashedID はセッション ID の SHA-256 ハッシュであり、生値は保存しない。
func (r *AuthRepository) CreateSession(ctx context.Context, hashedID, userID string, expiresAt time.Time) error {
	id, err := toBinaryUUID(userID)
	if err != nil {
		return err
	}
	return r.q.CreateSession(ctx, sqlcgen.CreateSessionParams{
		ID:        hashedID,
		UserID:    id,
		ExpiresAt: expiresAt,
	})
}

// FindUserBySession は有効なセッションに紐づく利用者を返す。
// 有効期限の判定はクエリ側で行うため、期限切れは行が無いことと区別できない。
func (r *AuthRepository) FindUserBySession(ctx context.Context, hashedID string, now time.Time) (domain.User, error) {
	row, err := r.q.GetSessionWithUser(ctx, sqlcgen.GetSessionWithUserParams{
		ID:  hashedID,
		Now: now,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, domain.ErrNotFound
		}
		return domain.User{}, err
	}
	return toDomainUserFromSession(row)
}

// DeleteSession はセッションを削除する。
// 存在しない ID を渡してもエラーにならない（0 行削除は成功）。
func (r *AuthRepository) DeleteSession(ctx context.Context, hashedID string) error {
	return r.q.DeleteSession(ctx, hashedID)
}
