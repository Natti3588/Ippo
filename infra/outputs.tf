output "vpc_id" {
  value = aws_vpc.main.id
}

output "upload_bucket" {
  value = aws_s3_bucket.uploads.bucket
}
