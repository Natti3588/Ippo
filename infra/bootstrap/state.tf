# ステートを置くバケット
# S3のバケット名は世界で一意でなければいけないので、アカウントIDを後ろにつける
resource "aws_s3_bucket" "state" {
  bucket = "ippo-tfstate-${data.aws_caller_identity.current.account_id}"
}

# バージョニングを入れるのは、ステートを壊したときに戻すため。
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
