###############################################################################
# Configuration
################################################################################

locals {
  # Use all availability zones in the region
  availability_zones = ["us-east-2a", "us-east-2b", "us-east-2c"]
}

###############################################################################
# Resources
################################################################################

# A VPC is a logically isolated network. Each environment should have one.
resource "aws_vpc" "playnet" {
  cidr_block           = "172.31.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# The internet gateway is a VPC component that enables internet access for the
# VPC over IPv4.
resource "aws_internet_gateway" "playnet" {
  vpc_id = aws_vpc.playnet.id
}

# A route table for the VPC that defaults as the main route table for the VPC
# will hold all routes to/from the network. By default, we permit all outgoing
# traffic.
resource "aws_default_route_table" "playnet" {
  default_route_table_id = aws_vpc.playnet.default_route_table_id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.playnet.id
  }
}

# Create a public-facing subnet in each availability zone, and associate it with
# the routing table for the VPC
resource "aws_subnet" "public" {
  count = length(local.availability_zones)

  availability_zone       = local.availability_zones[count.index]
  map_public_ip_on_launch = true
  vpc_id                  = aws_vpc.playnet.id

  cidr_block = cidrsubnet(aws_vpc.playnet.cidr_block, 4, count.index)

  tags = {
    Name = "${var.environment} // public // ${local.availability_zones[count.index]}"
  }
}


###############################################################################
# Outputs
################################################################################

output "aws" {
  description = "The AWS infrastructure"
  value = {
    vpc              = aws_vpc.playnet
    internet_gateway = aws_internet_gateway.playnet
    route_table      = aws_default_route_table.playnet
    subnets = {
      public = aws_subnet.public
    }
  }
}
