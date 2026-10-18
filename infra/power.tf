data "archive_file" "power" {
  type        = "zip"
  source_file = "${path.module}/lambda/power/handler.py"
  output_path = ".terraform/power.zip"
}

resource "aws_cloudwatch_log_group" "power" {
  name              = "/aws/lambda/ippo-power"
  retention_in_days = 14
}

data "aws_iam_policy_document" "power_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "power" {
  name               = "ippo-power"
  assume_role_policy = data.aws_iam_policy_document.power_assume.json
}

data "aws_iam_policy_document" "power" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.power.arn}:*"]
  }

  statement {
    actions   = ["ec2:DescribeInstances", "cloudwatch:DescribeAlarms"]
    resources = ["*"]
  }

  statement {
    actions   = ["ec2:StartInstances", "ec2:StopInstances"]
    resources = [aws_instance.nat.arn]
  }

  statement {
    actions   = ["rds:DescribeDBInstances", "rds:StartDBInstance", "rds:StopDBInstance"]
    resources = [aws_db_instance.db.arn]
  }

  statement {
    actions   = ["ecs:UpdateService"]
    resources = [aws_ecs_service.backend.arn, aws_ecs_service.frontend.arn]
  }

  statement {
    actions   = ["cloudwatch:EnableAlarmActions", "cloudwatch:DisableAlarmactions"]
    resources = ["arn:aws:cloudwatch:${var.region}:${data.aws_caller_identity.current.account_id}:alarm:ippo-*"]
  }

  statement {
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]
  }

  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_function.power.arn]
  }
}

resource "aws_iam_role_policy" "power" {
  name = "control-power"

  role   = aws_iam_role.power.id
  policy = data.aws_iam_policy_document.power.json
}

resource "aws_lambda_function" "power" {
  function_name = "ippo-power"
  role          = aws_iam_role.power.arn

  filename         = data.archive_file.power.output_path
  source_code_hash = data.archive_file.power.output_base64sha256
  handler          = "handler.handler"
  runtime          = "python3.12"

  architectures = ["arm64"]
  memory_size   = 128
  timeout       = 900

  environment {
    variables = {
      "CLUSTER"         = aws_ecs_cluster.ippo.name
      "SERVICES"        = "${aws_ecs_service.backend.name},${aws_ecs_service.frontend.name}"
      "DB_INSTANCE"     = aws_db_instance.db.identifier
      "NAT_INSTANCE_ID" = aws_instance.nat.id
      "ALARM_PREFIX"    = "ippo-"
    }
  }

  depends_on = [aws_cloudwatch_log_group.power]
}

resource "aws_lambda_function_event_invoke_config" "power" {
  function_name          = aws_lambda_function.power.function_name
  maximum_retry_attempts = 2

  destination_config {
    on_failure {
      destination = aws_sns_topic.alerts.arn
    }
  }
}

resource "aws_scheduler_schedule" "power" {
  for_each = {
    start = "cron(30 8 * * ? *)"
    stop  = "cron(0 21 * * ? *)"
  }

  name                         = "ippo-power-${each.key}"
  schedule_expression          = each.value
  schedule_expression_timezone = "Asia/Tokyo"
  state                        = var.power_schedule_enabled ? "ENABLED" : "DISABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.power.arn
    role_arn = aws_iam_role.power_scheduler.arn
    input    = jsonencode({ action = each.key })
  }
}

data "aws_iam_policy_document" "power_scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "power_scheduler" {
  name               = "ippo-power-scheduler"
  assume_role_policy = data.aws_iam_policy_document.power_scheduler_assume.json
}

data "aws_iam_policy_document" "power_scheduler" {
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_function.power.arn]
  }
}

resource "aws_iam_role_policy" "power_scheduler" {
  name = "control-power"

  role   = aws_iam_role.power_scheduler.id
  policy = data.aws_iam_policy_document.power_scheduler.json
}
