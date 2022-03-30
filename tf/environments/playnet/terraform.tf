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


###############################################################################
# Providers
################################################################################

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Contact     = "automation-alerts@portaldefi.com"
      Environment = var.environment
      Nme         = var.environment
      Owner       = "engineering"
      Terraform   = true
    }
  }
}
