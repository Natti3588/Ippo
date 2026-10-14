resource "aws_sns_topic" "alerts" {
  name = "ippo-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "healthy_hosts" {
  for_each = {
    backend  = aws_lb_target_group.backend
    frontend = aws_lb_target_group.frontend
  }

  alarm_name          = "ippo-${each.key}-healthy-hosts"
  alarm_description   = "${each.key} のターゲットグループで、ヘルスチェックに合格しているタスクが3分続けて0"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HealthyHostCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 3
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
    TargetGroup  = each.value.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  lifecycle {
    ignore_changes = [actions_enabled]
  }
}

resource "aws_cloudwatch_metric_alarm" "target_5xx" {
  alarm_name          = "ippo-target-5xx"
  alarm_description   = "タスクが返した5xxが5分間で5回以上"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  lifecycle {
    ignore_changes = [actions_enabled]
  }
}
