terraform {
  backend "s3" {
    key            = "playnet"
    bucket         = "portal.playnet.us-east-2.state"
    dynamodb_table = "portal.playnet.us-east-2.lock"
    region         = "us-east-2"
    encrypt        = true
  }

  required_providers {
    aws = { source = "hashicorp/aws" }
    tls = { source = "hashicorp/tls" }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Contact     = "anand@portaldefi.com"
      Environment = var.environment
      Owner       = "Engineering"
      Terraform   = true
    }
  }
}
