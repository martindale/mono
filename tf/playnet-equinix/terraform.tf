terraform {
  backend "s3" {
    region         = "us-east-2"
    bucket         = "tfstate.state"
    key            = "environments/playnet-equinix/terraform.state"
    dynamodb_table = "tfstate.lock"
    encrypt        = true
  }

  required_providers {
    cloudflare = { source = "cloudflare/cloudflare" }
    equinix    = { source = "equinix/equinix" }
    external   = { source = "hashicorp/external" }
    null       = { source = "hashicorp/null" }
    tls        = { source = "hashicorp/tls" }
  }
}

################################################################################
# Remote State
################################################################################

data "terraform_remote_state" "equinix" {
  backend = "s3"
  config = {
    region         = "us-east-2"
    bucket         = "tfstate.state"
    key            = "administration/equinix/terraform.state"
    dynamodb_table = "tfstate.lock"
  }
}

locals {
  equinix = data.terraform_remote_state.equinix.outputs
}

################################################################################
# Providers
################################################################################

provider "cloudflare" {
  account_id = var.cloudflare_account_id
}

provider "equinix" {
  # This token is read from the METAL_AUTH_TOKEN
  # auth_token = ""
}
