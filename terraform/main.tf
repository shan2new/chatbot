provider "aws" {
  region = "eu-north-1"
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

data "aws_availability_zones" "available" {}

resource "aws_subnet" "public_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index}"
  }
}

resource "aws_subnet" "private_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 2)
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = false

  tags = {
    Name = "private-subnet-${count.index}"
  }
}

resource "aws_security_group" "alb_sg" {
  name        = "allow_https"
  description = "Allow HTTPS traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-security-group"
  }
}

resource "aws_security_group" "allow_all" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow-all-security-group"
  }
}

resource "aws_ecs_cluster" "main" {
  name = "chatbot-cluster"

  tags = {
    Name = "chatbot-cluster"
  }
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "chatbot-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "chatbot-frontend"
      image     = "637423193263.dkr.ecr.eu-north-1.amazonaws.com/chatbot-demo-frontend:latest"
      essential = true
      cpu       = 256
      portMappings = [
        {
          containerPort = 3000
        }
      ]
      environment = [
        for key, value in var.frontend_env_vars : {
          name  = key
          value = value
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/chatbot-frontend"
          awslogs-region        = "eu-north-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      command = ["npm", "start"]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 60
        timeout     = 5
        retries     = 3
        startPeriod = 0
      }
    }
  ])
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "chatbot-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "chatbot-backend"
      image     = "637423193263.dkr.ecr.eu-north-1.amazonaws.com/chatbot-demo-backend:latest"
      essential = true
      cpu       = 256
      portMappings = [
        {
          containerPort = 8000
        }
      ]
      environment = [
        for key, value in var.backend_env_vars : {
          name  = key
          value = value
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/chatbot-backend"
          awslogs-region        = "eu-north-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      command = ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 60
        timeout     = 10
        retries     = 3
        startPeriod = 0
      }
    }
  ])
}

resource "aws_lb" "main" {
  name               = "chatbot-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnet[*].id

  tags = {
    Name = "chatbot-alb"
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "frontend-targets"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    interval            = 30
    path                = "/"
    timeout             = 5
    unhealthy_threshold = 2
    healthy_threshold   = 2
    matcher             = "200"
  }

  tags = {
    Name = "frontend-target-group"
  }
}

resource "aws_lb_target_group" "backend" {
  name        = "backend-targets"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    interval            = 30
    path                = "/api"
    timeout             = 5
    unhealthy_threshold = 2
    healthy_threshold   = 2
    matcher             = "200"
  }

  tags = {
    Name = "backend-target-group"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    path_pattern {
      values = ["/"]
    }
  }
}

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

resource "aws_ecs_service" "frontend" {
  name            = "chatbot-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_subnet[*].id
    security_groups = [aws_security_group.allow_all.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "chatbot-frontend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener_rule.frontend]
}

resource "aws_ecs_service" "backend" {
  name            = "chatbot-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_subnet[*].id
    security_groups = [aws_security_group.allow_all.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "chatbot-backend"
    container_port   = 8000
  }

  depends_on = [aws_lb_listener_rule.backend]
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "frontend_service_name" {
  value = aws_ecs_service.frontend.name
}

output "backend_service_name" {
  value = aws_ecs_service.backend.name
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}
