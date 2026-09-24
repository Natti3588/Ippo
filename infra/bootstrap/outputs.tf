output "state_bucket" {
  description = "本体のbackend.hcl に書くバケット名"
  value       = aws_s3_bucket.state.id
}

output "name_servers" {
  description = "レジストラに登録する NS コード"
  value       = aws_route53_zone.main.name_servers
}

output "zone_id" {
  value = aws_route53_zone.main.zone_id
}

# 検証の完了まで待ってから出力
output "acm_cloudfront_arn" {
  value = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "acm_alb_arn" {
  value = aws_acm_certificate_validation.alb.certificate_arn
}
