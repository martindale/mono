################################################################################
# Variables
################################################################################

variable "name" {
  description = "The unique name of the instance"
  type        = string
}

variable "environment" {
  description = "The parent environment of the instance"
  type        = string
}

variable "aws_networking" {
  description = "The `networking-aws` module that manages network for the instance"
  # type        = object({})
}

# AWS configuration

variable "aws_ami" {
  default = "The AWS machine image used to boot instances"
  type    = string
}

variable "aws_instance_type" {
  description = "The type of AWS instance to spin up"
  type        = string
}

variable "aws_key_pair" {
  description = "The public-key to be used for remote authentication as root"
  # type        = object({ name = string })
}

variable "aws_security_groups" {
  description = "A list of security groups to apply to the instance"
  # type        = list(object({ id = string }))
}

variable "aws_subnet" {
  description = "The `networking-aws`-defined subnet to place the instance in"
  type        = string

  validation {
    condition     = contains(["private", "public"], var.aws_subnet)
    error_message = "The subnet in which the instance will be placed."
  }
}

variable "aws_volumes" {
  description = "A map of volumes to attach to the instance"
  # type        = object({})
}

variable "aws_zone" {
  description = "The availablility zone to place the instance in"
  type        = string
}

# Cloudflare configuration

variable "cloudflare_account_id" {
  description = "The parent Cloudflare account identifier"
  type        = string
}

variable "cloudflare_zone_id" {
  default = "The cloudflare zone in which all the DNS records will be managed"
  type    = string
}
