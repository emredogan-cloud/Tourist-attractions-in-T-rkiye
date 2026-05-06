terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "turkiye-tf-state"
    key            = "prod/aws.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "turkiye-tf-lock"
    encrypt        = true
  }
}

variable "region" {
  type    = string
  default = "eu-central-1" # Frankfurt — primary
}

variable "environment" {
  type    = string
  default = "prod"
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project     = "turkiye-tourism"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source             = "terraform-aws-modules/vpc/aws"
  version            = "~> 5.0"
  name               = "turkiye-${var.environment}"
  cidr               = "10.20.0.0/16"
  azs                = ["${var.region}a", "${var.region}b", "${var.region}c"]
  private_subnets    = ["10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"]
  public_subnets     = ["10.20.101.0/24", "10.20.102.0/24", "10.20.103.0/24"]
  database_subnets   = ["10.20.201.0/24", "10.20.202.0/24", "10.20.203.0/24"]
  enable_nat_gateway = true
  single_nat_gateway = false
}

# Aurora Postgres 16 + PostGIS, 1 writer + 2 readers
module "aurora" {
  source            = "terraform-aws-modules/rds-aurora/aws"
  version           = "~> 9.0"
  name              = "turkiye-${var.environment}"
  engine            = "aurora-postgresql"
  engine_version    = "16.2"
  instance_class    = "db.r6g.large"
  instances         = { 1 = {}, 2 = {}, 3 = {} }
  vpc_id            = module.vpc.vpc_id
  db_subnet_group_name = module.vpc.database_subnet_group_name
  storage_encrypted = true
  apply_immediately = false

  # PostGIS + pgvector on first start
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

# ElastiCache Redis 7 cluster
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id          = "turkiye-${var.environment}"
  description                   = "Türkiye Tourism cache"
  engine                        = "redis"
  engine_version                = "7.1"
  node_type                     = "cache.t4g.small"
  num_node_groups               = 1
  replicas_per_node_group       = 2
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  subnet_group_name             = aws_elasticache_subnet_group.redis.name
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "turkiye-${var.environment}"
  subnet_ids = module.vpc.private_subnets
}

# ECS Fargate cluster
module "ecs" {
  source       = "terraform-aws-modules/ecs/aws"
  version      = "~> 5.0"
  cluster_name = "turkiye-${var.environment}"
  fargate_capacity_providers = {
    FARGATE      = { default_capacity_provider_strategy = { weight = 50 } }
    FARGATE_SPOT = { default_capacity_provider_strategy = { weight = 50 } }
  }
}

# Web service (Next.js)
module "web_service" {
  source             = "terraform-aws-modules/ecs/aws//modules/service"
  version            = "~> 5.0"
  name               = "web"
  cluster_arn        = module.ecs.cluster_arn
  cpu                = 1024
  memory             = 2048
  desired_count      = 3
  enable_autoscaling = true
  autoscaling_min_capacity = 3
  autoscaling_max_capacity = 24
  container_definitions = {
    web = {
      image  = "ghcr.io/emredogan-cloud/turkiye-web:latest"
      port   = 3000
      cpu    = 1024
      memory = 2048
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DATABASE_URL", value = module.aurora.cluster_endpoint }
      ]
    }
  }
}

output "aurora_endpoint" { value = module.aurora.cluster_endpoint }
output "aurora_reader_endpoint" { value = module.aurora.cluster_reader_endpoint }
output "redis_endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "ecs_cluster" { value = module.ecs.cluster_name }
