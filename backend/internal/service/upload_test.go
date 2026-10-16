package service

import (
	"context"
	"errors"
	"regexp"
	"testing"

	"github.com/Natti3588/Ippo/backend/internal/domain"
)

type fakeSigner struct {
	gotKey string
	err    error // 入っていれば、署名に失敗したことにする
}

func (s *fakeSigner) PresignPost(ctx context.Context, key string) (string, map[string]string, error) {
	s.gotKey = key
	if s.err != nil {
		return "", nil, s.err
	}
	return "https://example.test/", map[string]string{"policy": "p"}, nil
}

func TestCreateTicketKey(t *testing.T) {
	signer := &fakeSigner{}
	svc := NewUploadService(signer)

	_, err := svc.CreateTicket(context.Background())
	if err != nil {
		t.Fatalf("CreateTicket が失敗しました: %v", err)
	}

	jpegRegex := regexp.MustCompile(`^uploads/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$`)
	if ok := jpegRegex.MatchString(signer.gotKey); !ok {
		t.Errorf("key = %q, 形が違う", signer.gotKey)
	}
}

func TestCreateTicketFillsTicket(t *testing.T) {
	signer := &fakeSigner{}
	svc := NewUploadService(signer)

	ticket, err := svc.CreateTicket(context.Background())
	if err != nil {
		t.Fatalf("CreateTicket が失敗しました: %v", err)
	}

	if want := "/" + signer.gotKey; ticket.Path != want {
		t.Errorf("Path = %q, want %q", ticket.Path, want)
	}
	if ticket.URL != "https://example.test/" {
		t.Errorf("URL = %q, signer が返したものと違う", ticket.URL)
	}
	if ticket.Fields["policy"] != "p" {
		t.Errorf("Fields = %v, signer が返したものと違う", ticket.Fields)
	}
}

func TestCreateTicketWithoutSigner(t *testing.T) {
	svc := NewUploadService(nil)

	_, err := svc.CreateTicket(context.Background())
	if !errors.Is(err, domain.ErrUploadUnavailable) {
		t.Errorf("err = %v, want ErrUploadUnavailable", err)
	}
}

func TestCreateTicketSignerError(t *testing.T) {
	errSign := errors.New("sign failed")
	signer := &fakeSigner{err: errSign}
	svc := NewUploadService(signer)

	_, err := svc.CreateTicket(context.Background())
	if !errors.Is(err, errSign) {
		t.Errorf("err = %v, signer のエラーを取り出せない", err)
	}
}
