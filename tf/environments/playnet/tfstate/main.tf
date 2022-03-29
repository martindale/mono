terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

provider "aws" {
  region = "us-east-2"
}

module "playnet" {
  source      = "../../../modules/tfstate-aws"
  environment = "playnet"
  region      = "us-east-2"
}
