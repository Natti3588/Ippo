resource "aws_ecs_cluster" "ippo" {
  name = "ippo"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "ippo-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${data.aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"
      essential = true

      portMappings = [{
        containerPort = 8080,
        protocol      = "tcp"
      }]

      environment = [
        { name = "DB_HOST", value = aws_db_instance.db.address },
        { name = "DB_PORT", value = tostring(aws_db_instance.db.port) },
        { name = "DB_NAME", value = aws_db_instance.db.db_name },
        { name = "DB_USER", value = aws_db_instance.db.username },
      ]

      secrets = [
        { name = "DB_PASSWORD", valueFrom = "${aws_db_instance.db.master_user_secret[0].secret_arn}:password::" },
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name                              = "ippo-backend"
  cluster                           = aws_ecs_cluster.ippo.id
  task_definition                   = aws_ecs_task_definition.backend.arn
  launch_type                       = "FARGATE"
  desired_count                     = 1
  health_check_grace_period_seconds = 60

  network_configuration {
    subnets          = aws_subnet.app[*].id
    security_groups  = [aws_security_group.backend.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [
    aws_lb_listener.https,
    aws_route.app_default,
    aws_iam_role_policy.db,
    aws_iam_role_policy_attachment.ecs_execution,
  ]
}
