################################################################################
# Variables
################################################################################

variable "environment" {
  description = "The unique name of the environment"
  type        = string
}

# AWS configuration

variable "aws_vpc_cidr_block" {
  description = "The IPv4 CIDR block used by the VPC for the environment"
  type        = string
}

variable "aws_availability_zones" {
  description = "A list of availability zones in the region"
  type        = list(string)
}
