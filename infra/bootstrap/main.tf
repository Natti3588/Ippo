terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "Ippo"
      ManagedBy = "terraform"
      Layer     = "bootstrap"
    }
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "Ippo"
      ManagedBy = "terraform"
      Layer     = "bootstrap"
    }
  }
}

data "aws_caller_identity" "current" {}
