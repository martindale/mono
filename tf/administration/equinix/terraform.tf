terraform {
  backend "s3" {
    region         = "us-east-2"
    bucket         = "tfstate.state"
    key            = "administration/equinix/terraform.state"
    dynamodb_table = "tfstate.lock"
    encrypt        = true
  }

  required_providers {
    equinix = { source = "equinix/equinix" }
  }
}


###############################################################################
# Providers
################################################################################

provider "equinix" {
  # This token is read from the METAL_AUTH_TOKEN
  # auth_token = ""
}
