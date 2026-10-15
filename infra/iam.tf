# タスク実行ロール。ECS がタスクを起動する前に、このロールでイメージを取り、ログの送り先を用意し、シークレットを読む。
# frontend と backend で共有する。シークレットを読むのはタスク定義に secrets を書いた backend だけ。
data "aws_iam_policy_document" "ecs_execution_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "ippo-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_execution_assume.json
}

# ECR からの取得と、CloudWatch Logs への書き込み。
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "backend_task" {
  name               = "ippo-backend-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_execution_assume.json
}

data "aws_iam_policy_document" "backend_task" {
  statement {
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/uploads/*"]
  }
}

resource "aws_iam_role_policy" "backend_task" {
  name   = "put-uploads"
  role   = aws_iam_role.backend_task.id
  policy = data.aws_iam_policy_document.backend_task.json
}
