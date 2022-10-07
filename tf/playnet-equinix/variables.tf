variable "environment" {
  description = "The unique name of the environment"
  type        = string
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
