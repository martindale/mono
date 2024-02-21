terraform {
  required_providers {
    external = { source = "hashicorp/external" }
    null     = { source = "hashicorp/null" }
  }
}


################################################################################
# Variables
################################################################################

variable "configuration" {
  description = "The Nix configuration to build"
  type        = string
}

variable "target" {
  description = "The target of the deployment"
  type = object({
    key          = string
    host         = string
    user         = string
    bastion_host = optional(string)
    bastion_user = optional(string)
  })
}

variable "triggers" {
  default     = {}
  description = "Triggers for deploy"
  type        = map(string)
}


################################################################################
# Resources
################################################################################

data "external" "derivation" {
  program = [
    "${path.module}/derive.sh",
    "${path.module}/default.nix",
    "--arg", "configuration", var.configuration
  ]
}

locals {
  derivation = data.external.derivation.result
}

resource "null_resource" "realization" {
  triggers = merge(var.triggers, { derivation = local.derivation.path })

  provisioner "local-exec" {
    command = join(" ", concat([
      "${path.module}/deploy.sh",
      local.derivation.path,
      "${var.target.user}@${var.target.host}"
      ], var.target.bastion_user == null ? [] : [
      "${var.target.bastion_user}@${var.target.bastion_host}"
    ]))
    environment = {
      # marked non-sensitive since deploy.sh takes care of its clean up
      SSH_PRIVATE_KEY = nonsensitive(var.target.key)
    }
  }
}


################################################################################
# Outputs
################################################################################

output "derivation" {
  description = "The NixOS derivation used to build the OS"
  value       = local.derivation.path
}
