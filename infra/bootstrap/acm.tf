# CloudFrontでHTTPS通信に塚うTLS証明書を取得
# CloudFrontに設定するTLS証明書は us-east-1 である必要がある
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us-east-1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate" "alb" {
  domain_name       = "origin.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 検証用の CNAME を同じホストゾーンに置く
resource "aws_route53_record" "cert_validation_cloudfront" {
  for_each = {
    for o in aws_acm_certificate.cloudfront.domain_validation_options :
    o.domain_name => {
      name   = o.resource_record_name
      type   = o.resource_record_type
      record = o.resource_record_value
    }
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_route53_record" "cert_validation_alb" {
  for_each = {
    for o in aws_acm_certificate.alb.domain_validation_options :
    o.domain_name => {
      name   = o.resource_record_name
      record = o.resource_record_value
      type   = o.resource_record_type
    }
  }

  zone_id         = aws_route53_zone.main.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# 検証が通るまで apply を進ませない
# これがないと、保留中の検証の証明書を ALB につけようとして失敗する
resource "aws_acm_certificate_validation" "cloudfront" {
  provider                = aws.us-east-1
  certificate_arn         = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation_cloudfront : r.fqdn]
}

resource "aws_acm_certificate_validation" "alb" {
  certificate_arn         = aws_acm_certificate.alb.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation_alb : r.fqdn]
}
