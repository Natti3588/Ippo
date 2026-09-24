data "aws_route53_zone" "main" {
  name = var.domain_name
}

data "aws_acm_certificate" "cloudfront" {
  provider    = aws.us-east-1
  domain      = var.domain_name
  most_recent = true
  statuses    = ["ISSUED"]
}

data "aws_acm_certificate" "alb" {
  domain      = "origin.${var.domain_name}"
  most_recent = true
  statuses    = ["ISSUED"]
}

data "aws_ecr_repository" "backend" {
  name = "ippo-backend"
}

data "aws_ecr_repository" "frontend" {
  name = "ippo-frontend"
}

