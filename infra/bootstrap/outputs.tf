output "state_bucket" {
  description = "本体のbackend.hcl に書くバケット名"
  value       = aws_s3_bucket.state.id
}
