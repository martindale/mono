terraform {
  backend "s3" {
    region         = "us-east-2"
    bucket         = "tfstate.state"
    key            = "environments/devnet/terraform.state"
    dynamodb_table = "tfstate.lock"
    encrypt        = true
  }

  required_providers {
    aws        = { source = "hashicorp/aws" }
    cloudflare = { source = "cloudflare/cloudflare" }
    external   = { source = "hashicorp/external" }
    null       = { source = "hashicorp/null" }
    tls        = { source = "hashicorp/tls" }
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
      Owner       = "engineering"
      Contact     = "eric+devnet@portaldefi.com"
      Terraform   = true
      Workspace   = terraform.workspace
    }
  }
}

provider "cloudflare" {
  account_id = var.cloudflare_account_id
}
