terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-2"
}

# S3 Bucket for Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket = "mclass-terraform-state"

  tags = {
    Name = "mclass-terraform-state"
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "mclass-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "mclass-public-subnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "mclass-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "mclass-public-rt"
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs" {
  name        = "mclass-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "mclass-ecs-sg"
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "mclass-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

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
    Name = "mclass-alb-sg"
  }
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name                 = "mclass-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mclass-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Execution Role Policy for Parameter Store access
resource "aws_iam_role_policy" "ecs_task_execution_parameter_store" {
  name = "ecs-task-execution-parameter-store"
  role = aws_iam_role.ecs_task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:ap-northeast-2:664418970959:parameter/mclass/*"
      }
    ]
  })
}

# ECS Task Role
resource "aws_iam_role" "ecs_task_role" {
  name = "ecsTaskRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "mclass-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
}

# ALB Target Group
resource "aws_lb_target_group" "main" {
  name        = "mclass-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ECS Service
resource "aws_ecs_service" "main" {
  name            = "mclass-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.main.arn
    container_name   = "mclass-server"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.main]
}

# ECS Task Definition
resource "aws_ecs_task_definition" "main" {
  family                   = "mclass-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "mclass-server"
      image = "${aws_ecr_repository.app.repository_url}:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      essential = true
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "KAKAO_CLIENT_ID"
          valueFrom = aws_ssm_parameter.kakao_client_id.arn
        },
        {
          name      = "KAKAO_CLIENT_SECRET"
          valueFrom = aws_ssm_parameter.kakao_client_secret.arn
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = aws_ssm_parameter.google_client_id.arn
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = aws_ssm_parameter.google_client_secret.arn
        },
        {
          name      = "NAVER_CLIENT_ID"
          valueFrom = aws_ssm_parameter.naver_client_id.arn
        },
        {
          name      = "NAVER_CLIENT_SECRET"
          valueFrom = aws_ssm_parameter.naver_client_secret.arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = aws_ssm_parameter.redis_url.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/mclass-task"
          awslogs-region        = "ap-northeast-2"
          awslogs-stream-prefix = "ecs"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/mclass-task"
  retention_in_days = 7
}

# 무료 모니터링 스택 (ECS에서 실행)

# Prometheus ECS Task Definition
resource "aws_ecs_task_definition" "prometheus" {
  family                   = "mclass-prometheus-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "prometheus"
      image = "prom/prometheus:latest"
      portMappings = [
        {
          containerPort = 9090
          protocol      = "tcp"
        }
      ]
      essential = true
      command = [
        "--config.file=/etc/prometheus/prometheus.yml",
        "--storage.tsdb.path=/prometheus",
        "--web.console.libraries=/etc/prometheus/console_libraries",
        "--web.console.templates=/etc/prometheus/consoles"
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/mclass-prometheus-task"
          awslogs-region        = "ap-northeast-2"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# Prometheus ECS Service
resource "aws_ecs_service" "prometheus" {
  name            = "mclass-prometheus-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.prometheus.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.prometheus.id]
    assign_public_ip = true
  }
}

# Prometheus Security Group
resource "aws_security_group" "prometheus" {
  name        = "mclass-prometheus-sg"
  description = "Security group for Prometheus"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 9090
    to_port     = 9090
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
    Name = "mclass-prometheus-sg"
  }
}

# Grafana ECS Task Definition
resource "aws_ecs_task_definition" "grafana" {
  family                   = "mclass-grafana-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "grafana"
      image = "grafana/grafana:latest"
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      essential = true
      environment = [
        {
          name  = "GF_SECURITY_ADMIN_PASSWORD"
          value = "admin123"
        },
        {
          name  = "GF_INSTALL_PLUGINS"
          value = "grafana-piechart-panel"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/mclass-grafana-task"
          awslogs-region        = "ap-northeast-2"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# Grafana ECS Service
resource "aws_ecs_service" "grafana" {
  name            = "mclass-grafana-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.grafana.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.grafana.id]
    assign_public_ip = true
  }
}

# Grafana Security Group
resource "aws_security_group" "grafana" {
  name        = "mclass-grafana-sg"
  description = "Security group for Grafana"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 3000
    to_port     = 3000
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
    Name = "mclass-grafana-sg"
  }
}

# Prometheus CloudWatch Log Group
resource "aws_cloudwatch_log_group" "prometheus" {
  name              = "/ecs/mclass-prometheus-task"
  retention_in_days = 7
}

# Grafana CloudWatch Log Group
resource "aws_cloudwatch_log_group" "grafana" {
  name              = "/ecs/mclass-grafana-task"
  retention_in_days = 7
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "rds_port" {
  value = aws_db_instance.main.port
}

# output "prometheus_workspace_id" {
#   value = aws_prometheus_workspace.main.id
# }

# output "prometheus_endpoint" {
#   value = aws_prometheus_workspace.main.prometheus_endpoint
# }

# output "grafana_workspace_url" {
#   value = aws_grafana_workspace.main.endpoint
# }

# AWS Managed Prometheus 워크스페이스 (비용 발생 - 주석 처리)
# resource "aws_prometheus_workspace" "main" {
#   alias = "mclass-prometheus"

#   tags = {
#     Name = "mclass-prometheus-workspace"
#   }
# }

# AWS Managed Grafana 워크스페이스 (비용 발생 - 주석 처리)
# resource "aws_grafana_workspace" "main" {
#   account_access_type      = "CURRENT_ACCOUNT"
#   authentication_providers = ["AWS_SSO"]
#   permission_type         = "SERVICE_MANAGED"
#   role_arn                = aws_iam_role.grafana_role.arn

#   tags = {
#     Name = "mclass-grafana-workspace"
#   }
# }

# Grafana IAM Role (비용 발생 - 주석 처리)
# resource "aws_iam_role" "grafana_role" {
#   name = "grafana-role"

#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "grafana.amazonaws.com"
#         }
#       }
#     ]
#   })
# }

# Parameter Store for Environment Variables
resource "aws_ssm_parameter" "database_url" {
  name  = "/mclass/database_url"
  type  = "SecureString"
  value = "postgresql://postgres:${var.database_password}@${aws_db_instance.main.endpoint}:5432/mclass_prod"

  tags = {
    Name = "mclass-database-url"
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/mclass/jwt_secret"
  type  = "SecureString"
  value = var.jwt_secret

  tags = {
    Name = "mclass-jwt-secret"
  }
}

# Redis URL
resource "aws_ssm_parameter" "redis_url" {
  name      = "/mclass/redis_url"
  type      = "SecureString"
  value     = var.redis_url != "" ? var.redis_url : "redis://redis:6379"
  overwrite = true

  tags = {
    Name = "mclass-redis-url"
  }
}

resource "aws_ssm_parameter" "kakao_client_id" {
  name      = "/mclass/kakao_client_id"
  type      = "SecureString"
  value     = var.kakao_client_id
  overwrite = true

  tags = {
    Name = "mclass-kakao-client-id"
  }
}

resource "aws_ssm_parameter" "kakao_client_secret" {
  name      = "/mclass/kakao_client_secret"
  type      = "SecureString"
  value     = var.kakao_client_secret
  overwrite = true

  tags = {
    Name = "mclass-kakao-client-secret"
  }
}

resource "aws_ssm_parameter" "google_client_id" {
  name      = "/mclass/google_client_id"
  type      = "SecureString"
  value     = var.google_client_id
  overwrite = true

  tags = {
    Name = "mclass-google-client-id"
  }
}

resource "aws_ssm_parameter" "google_client_secret" {
  name      = "/mclass/google_client_secret"
  type      = "SecureString"
  value     = var.google_client_secret
  overwrite = true

  tags = {
    Name = "mclass-google-client-secret"
  }
}

resource "aws_ssm_parameter" "naver_client_id" {
  name      = "/mclass/naver_client_id"
  type      = "SecureString"
  value     = var.naver_client_id
  overwrite = true

  tags = {
    Name = "mclass-naver-client-id"
  }
}

resource "aws_ssm_parameter" "naver_client_secret" {
  name      = "/mclass/naver_client_secret"
  type      = "SecureString"
  value     = var.naver_client_secret
  overwrite = true

  tags = {
    Name = "mclass-naver-client-secret"
  }
}

# 초기 관리자 관련 SSM 파라미터들 추가
resource "aws_ssm_parameter" "initial_admin_email" {
  name      = "/mclass/initial_admin_email"
  type      = "SecureString"
  value     = var.initial_admin_email
  overwrite = true

  tags = {
    Name = "mclass-initial-admin-email"
  }
}

resource "aws_ssm_parameter" "initial_admin_password" {
  name      = "/mclass/initial_admin_password"
  type      = "SecureString"
  value     = var.initial_admin_password
  overwrite = true

  tags = {
    Name = "mclass-initial-admin-password"
  }
}

resource "aws_ssm_parameter" "initial_admin_name" {
  name      = "/mclass/initial_admin_name"
  type      = "SecureString"
  value     = var.initial_admin_name
  overwrite = true

  tags = {
    Name = "mclass-initial-admin-name"
  }
}

# ECS Task Role Policy for Parameter Store access
resource "aws_iam_role_policy" "ecs_task_parameter_store" {
  name = "ecs-task-parameter-store"
  role = aws_iam_role.ecs_task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:ap-northeast-2:664418970959:parameter/mclass/*"
      }
    ]
  })
}

# Grafana IAM Role Policy (비용 발생 - 주석 처리)
# resource "aws_iam_role_policy" "grafana_policy" {
#   name = "grafana-policy"
#   role = aws_iam_role.grafana_role.id

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "aps:QueryMetrics",
#           "aps:GetLabels",
#           "aps:GetMetricMetadata",
#           "aps:GetSeries",
#           "logs:DescribeLogGroups",
#           "logs:GetLogEvents",
#           "logs:StartQuery",
#           "logs:GetQueryResults",
#           "logs:StopQuery"
#         ]
#         Resource = "*"
#       }
#     ]
#   })
# } 

# RDS PostgreSQL 인스턴스
resource "aws_db_subnet_group" "main" {
  name       = "mclass-db-subnet-group"
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "mclass-db-subnet-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "mclass-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "mclass-rds-sg"
  }
}

resource "aws_db_instance" "main" {
  identifier = "mclass-postgresql"

  engine         = "postgres"
  engine_version = "15.10"
  instance_class = "db.t3.micro" # 프리티어

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "mclass_prod"
  username = "postgres"
  password = var.database_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "mclass-postgresql"
  }
} 