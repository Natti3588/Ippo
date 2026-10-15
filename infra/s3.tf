data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "uploads" {
  bucket        = "ippo-uploads-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_methods = ["POST"]
    allowed_origins = ["https://${var.domain_name}", "http://localhost:3000"]
    max_age_seconds = 3000
  }
}

data "aws_iam_policy_document" "uploads_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/uploads/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket     = aws_s3_bucket.uploads.id
  policy     = data.aws_iam_policy_document.uploads_bucket.json
  depends_on = [aws_s3_bucket_public_access_block.uploads]
}
