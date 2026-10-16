package storage

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const (
	maxUploadBytes    = 5 << 20 // 5MB
	uploadExpires     = 5 * time.Minute
	uploadContentType = "image/jpeg"
)

type S3Signer struct {
	client *s3.PresignClient
	bucket string
}

func NewS3Signer(cfg aws.Config, bucket string) *S3Signer {
	client := s3.NewPresignClient(s3.NewFromConfig(cfg))
	return &S3Signer{client: client, bucket: bucket}
}

func (s *S3Signer) PresignPost(ctx context.Context, key string) (string, map[string]string, error) {
	req, err := s.client.PresignPostObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(o *s3.PresignPostOptions) {
		o.Expires = uploadExpires
		o.Conditions = []any{
			[]any{"content-length-range", 1, maxUploadBytes},
			map[string]string{"Content-Type": uploadContentType},
		}
	})
	if err != nil {
		return "", nil, err
	}

	req.Values["Content-Type"] = uploadContentType
	return req.URL, req.Values, nil
}
