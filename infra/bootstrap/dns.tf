# ホストゾーンは破棄しない側に置く
resource "aws_route53_zone" "main" {
  name = var.domain_name
}
