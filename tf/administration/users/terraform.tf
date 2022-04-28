terraform {
  backend "s3" {
    region         = "us-east-2"
    bucket         = "tfstate.state"
    key            = "administration/users/terraform.state"
    dynamodb_table = "tfstate.lock"
    encrypt        = true
  }

  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}


###############################################################################
# Providers
################################################################################

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Name        = var.environment
      Environment = var.environment
      Owner       = "operations"
      Contact     = "automation-alerts@portaldefi.com"
      Terraform   = true
    }
  }
}
