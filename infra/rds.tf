resource "aws_db_subnet_group" "db" {
  name       = "ippo-db"
  subnet_ids = aws_subnet.database[*].id
}

resource "aws_db_instance" "db" {
  identifier     = "ippo-db"
  engine         = "mysql"
  engine_version = "8.4"
  instance_class = "db.t4g.micro"

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = false

  db_name                     = "ippo"
  username                    = "admin"
  manage_master_user_password = true

  storage_type      = "gp3"
  allocated_storage = 20
  storage_encrypted = true

  backup_retention_period = 0
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name = "ippo-db"
  }
}

data "aws_iam_policy_document" "read_db_secret" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_db_instance.db.master_user_secret[0].secret_arn]
  }
}
resource "aws_iam_role_policy" "db" {
  role   = aws_iam_role.ecs_execution.id
  policy = data.aws_iam_policy_document.read_db_secret.json
}
