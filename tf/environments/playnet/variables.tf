variable "environment" {
  description = "The unique name of the environment"
  type        = string
}


################################################################################
# AWS configuration
################################################################################

variable "aws_region" {
  description = "The AWS region where the environment is setup"
  type        = string
}

variable "aws_vpc_cidr_block" {
  description = "The IPv4 CIDR block used by the VPC for the environment"
  type        = string
}

variable "aws_ami" {
  default = "The AWS machine image used to boot instances"
  type    = string
}


################################################################################
# Cloudflare configuration
################################################################################

variable "cloudflare_account_id" {
  description = "The parent Cloudflare account identifier"
  type        = string
}

variable "cloudflare_zone_id" {
  default = "The cloudflare zone in which all the DNS records will be managed"
  type    = string
}


################################################################################
# Ethereum configuration
################################################################################

variable "ethereum-url" {
  description = "The URL to the Ethereum full-node."
  type        = string
}


################################################################################
# Matrix configuration
################################################################################

variable "matrix-url" {
  description = "The URL to the Matrix home server."
  type        = string
}


################################################################################
# Raiden configuration
################################################################################

variable "raiden-network" {
  description = "The name of the Ethereum network Raiden will connect to."
  type        = string
}

variable "raiden-node-address" {
  description = "The address to be used by the Raiden node."
  type        = string
}

variable "raiden-udc-address" {
  description = "The address of the user-deposit-contract."
  type        = string
}

variable "raiden-pfs-url" {
  description = "The URL of the Raiden Path-Finding Service."
  type        = string
}
