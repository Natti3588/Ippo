package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/Natti3588/Ippo/backend/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

// SessionLifetime はセッションの有効期間。
// sessions の行を削除すれば即座に失効させられるため、長めでも取り返しがつく。
const SessionLifetime = 7 * 24 * time.Hour

// maxPasswordBytes は bcrypt が実際に見る上限。これを超える入力は弾く。
const maxPasswordBytes = 72

type AuthRepository interface {
	CreateUser(ctx context.Context, u domain.User) (domain.User, error)
	FindUserByEmail(ctx context.Context, email string) (domain.User, error)
	UpdateDisplayName(ctx context.Context, userID, displayName string) error

	CreateSession(ctx context.Context, hashedID, userID string, expiresAt time.Time) error
	FindUserBySession(ctx context.Context, hashedID string, now time.Time) (domain.User, error)
	DeleteSession(ctx context.Context, hashedID string) error
}

// Session はクライアントに渡すセッション。
// ID は生値であり、データベースにはこの SHA-256 ハッシュだけが保存される。
type Session struct {
	ID        string
	ExpiresAt time.Time
}

type AuthService struct {
	repo AuthRepository
}

func NewAuthService(repo AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

// dummyPasswordHash は、利用者が存在しないときにも比較処理を走らせるための、
// どのパスワードとも一致しないハッシュ。最初に必要になったとき一度だけ計算する。
var dummyPasswordHash = sync.OnceValue(func() []byte {
	h, err := bcrypt.GenerateFromPassword([]byte("ippo"), bcrypt.DefaultCost)
	if err != nil {
		return []byte("$2a$10$invalid")
	}
	return h
})

// hashSessionID は Cookie の生値から、保存と照合に使うハッシュを作る。
func hashSessionID(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

// newSessionID は Cookie に入れる生値と、保存するハッシュを返す。
// 生値は base64url（43文字）、ハッシュは16進（64文字）で、形をわざと変えてある。
// 生値を誤って保存しようとすると、sessions の chk_sessions_id に弾かれる。
func newSessionID() (raw, hashed string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("セッションIDの生成に失敗: %w", err)
	}
	raw = base64.RawURLEncoding.EncodeToString(b)
	return raw, hashSessionID(raw), nil
}

func (s *AuthService) issueSession(ctx context.Context, userID string) (Session, error) {
	raw, hashed, err := newSessionID()
	if err != nil {
		return Session{}, err
	}

	expiresAt := time.Now().UTC().Add(SessionLifetime)
	if err := s.repo.CreateSession(ctx, hashed, userID, expiresAt); err != nil {
		return Session{}, err
	}
	return Session{ID: raw, ExpiresAt: expiresAt}, nil
}

func (s *AuthService) SignUp(ctx context.Context, email, password, displayName string) (domain.User, Session, error) {
	if len(password) > maxPasswordBytes {
		return domain.User{}, Session{}, fmt.Errorf("パスワードが長すぎます: %w", domain.ErrInvalidInput)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return domain.User{}, Session{}, fmt.Errorf("パスワードのハッシュ化に失敗: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, domain.User{
		Email:        strings.ToLower(email),
		DisplayName:  displayName,
		PasswordHash: string(hash),
	})
	if err != nil {
		return domain.User{}, Session{}, err
	}

	sess, err := s.issueSession(ctx, user.Id)
	if err != nil {
		return domain.User{}, Session{}, err
	}

	user.PasswordHash = ""
	return user, sess, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (domain.User, Session, error) {
	user, err := s.repo.FindUserByEmail(ctx, strings.ToLower(email))
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			// 利用者がいなくても比較を走らせる。
			// ここで先に返すと、応答の速さから登録済みかどうかが分かってしまう。
			_ = bcrypt.CompareHashAndPassword(dummyPasswordHash(), []byte(password))
			return domain.User{}, Session{}, domain.ErrInvalidCredentials
		}
		return domain.User{}, Session{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return domain.User{}, Session{}, domain.ErrInvalidCredentials
	}

	sess, err := s.issueSession(ctx, user.Id)
	if err != nil {
		return domain.User{}, Session{}, err
	}

	user.PasswordHash = ""
	return user, sess, nil
}

// Authenticate は Cookie の生値から利用者を引く。次の段階で認証ミドルウェアが使う。
func (s *AuthService) Authenticate(ctx context.Context, rawSessionID string) (domain.User, error) {
	return s.repo.FindUserBySession(ctx, hashSessionID(rawSessionID), time.Now().UTC())
}

// Logout はセッションを削除する。存在しない ID でもエラーにはならない。
func (s *AuthService) Logout(ctx context.Context, rawSessionID string) error {
	return s.repo.DeleteSession(ctx, hashSessionID(rawSessionID))
}

// UpdateDisplayName は表示名を変更し、変更後の利用者を返す。
// MySQL に RETURNING が無いため、読み直さずに手元の値を書き換えて返す。
func (s *AuthService) UpdateDisplayName(ctx context.Context, user domain.User, displayName string) (domain.User, error) {
	if err := s.repo.UpdateDisplayName(ctx, user.Id, displayName); err != nil {
		return domain.User{}, err
	}
	user.DisplayName = displayName
	return user, nil
}
