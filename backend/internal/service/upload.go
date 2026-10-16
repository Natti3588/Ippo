package service

import (
	"context"
	"fmt"

	"github.com/Natti3588/Ippo/backend/internal/domain"
	"github.com/google/uuid"
)

type UploadSigner interface {
	PresignPost(ctx context.Context, key string) (string, map[string]string, error)
}

type UploadService struct {
	signer UploadSigner
}

func NewUploadService(signer UploadSigner) *UploadService {
	return &UploadService{signer: signer}
}

func (s *UploadService) CreateTicket(ctx context.Context) (domain.UploadTicket, error) {
	if s.signer == nil {
		return domain.UploadTicket{}, domain.ErrUploadUnavailable
	}

	key := "uploads/" + uuid.NewString() + ".jpg"
	postURL, formFields, err := s.signer.PresignPost(ctx, key)
	if err != nil {
		return domain.UploadTicket{}, fmt.Errorf("署名付きPOSTリクエストの生成に失敗: %w", err)
	}

	return domain.UploadTicket{URL: postURL, Fields: formFields, Path: "/" + key}, nil
}
