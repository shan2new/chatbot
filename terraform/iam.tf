resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        },
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecs_task_execution_policy" {
  name       = "ecs-task-execution-policy"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  roles      = [aws_iam_role.ecs_task_execution_role.name]
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name = "CloudWatchLogsPolicy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "attach_cloudwatch_logs_policy" {
  name       = "attach-cloudwatch-logs-policy"
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
  roles      = [aws_iam_role.ecs_task_execution_role.name]
}

resource "aws_iam_policy" "ecr_access_policy" {
  name = "ECRAccessPolicy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "attach_ecr_access_policy" {
  name       = "attach-ecr-access-policy"
  policy_arn = aws_iam_policy.ecr_access_policy.arn
  roles      = [aws_iam_role.ecs_task_execution_role.name]
}
