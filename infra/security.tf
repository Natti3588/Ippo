# CloudFront がオリジンへ出ていくときの IP 範囲。。
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "ippo-alb-sg"
  description = "ALB. Allow 443 from CloudFront only"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "ippo-alb-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id = aws_security_group.alb.id
  description       = "From CloudFront"
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

# 開発中だけ。CloudFront を作る前は、これが無いと動作を確かめられない。
# var.dev_allow_cidrs を空にすると、このルールは消える。
resource "aws_vpc_security_group_ingress_rule" "alb_from_dev" {
  for_each = toset(var.dev_allow_cidrs)

  security_group_id = aws_security_group.alb.id
  description       = "Direct access during development"
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
  security_group_id = aws_security_group.alb.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "frontend" {
  name        = "ippo-frontend-sg"
  description = "Next.js. Allow 3000 from ALB only"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ippo-frontend-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "frontend_from_alb" {
  security_group_id            = aws_security_group.frontend.id
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
}

# ECR・CloudWatch Logs・Secrets Manager へ出る。公開 IP から IGW 経由。
resource "aws_vpc_security_group_egress_rule" "frontend_all" {
  security_group_id = aws_security_group.frontend.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_security_group" "backend" {
  name        = "ippo-backend-sg"
  description = "Go API. Allow 8080 from ALB only"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "ippo-backend-sg"
  }
}

resource "aws_vpc_security_group_ingress_rule" "backend_from_alb" {
  security_group_id            = aws_security_group.backend.id
  referenced_security_group_id = aws_security_group.alb.id
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
}

resource "aws_vpc_security_group_egress_rule" "backend_all" {
  security_group_id = aws_security_group.backend.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# Go API からだけ。Next.js からも ALB からも通さない。
resource "aws_security_group" "rds" {
  name        = "ippo-rds-sg"
  description = "RDS. Allow 3306 from Go API only"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "ippo-rds-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_backend" {
  security_group_id            = aws_security_group.rds.id
  referenced_security_group_id = aws_security_group.backend.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}
