terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}


################################################################################
# Resources
################################################################################

# A VPC is a logically isolated network
resource "aws_vpc" "this" {
  cidr_block           = var.aws_vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# Clear the default route table to remove any defaults
resource "aws_default_route_table" "default" {
  default_route_table_id = aws_vpc.this.default_route_table_id
  route                  = []
}

# The internet gateway is a VPC component that enables internet access for the
# VPC over IPv4.
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
}


################################################################################
# Public Subnets
################################################################################

# Each AWS region has multiple availability zones, and our private and public
# subnets are spread across all specified AZs
locals {
  az_names = var.aws_availability_zones
  az_count = length(local.az_names)
  azs = { for i in range(0, local.az_count) : local.az_names[i] => {
    index = i,

    // Lower CIDR ranges (x.x.{0..127},x) are for public facing subnets
    public_ipv4_cidr = cidrsubnet(aws_vpc.this.cidr_block, 8, i),

    // Higher CIDR ranges (x.x.{128..255},x) are for public facing subnets
    private_ipv4_cidr = cidrsubnet(aws_vpc.this.cidr_block, 8, i + 128)
  } }
}


# The public subnet auto-assigns public IP addresses to all instances attached
# to the subnet, and hosts any/all public-facing services, such as web-servers
# and bastion hosts.
resource "aws_subnet" "public" {
  for_each = local.azs

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value.public_ipv4_cidr
  tags              = { Name = "${var.environment} // public // ${each.key}" }

  # This ensures each instance assigned to this subnet automatically gets a
  # public IPv4 address
  map_public_ip_on_launch = true
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.environment} // public" }

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }
}

resource "aws_route_table_association" "public" {
  for_each = local.azs

  route_table_id = aws_route_table.public.id
  subnet_id      = aws_subnet.public[each.key].id
}

# Allocate sufficient elsatic IPs to setup a NAT gateway in each public subnet,
# to be used by private subnet instances to route out to the internet.
resource "aws_eip" "this" {
  for_each = local.azs

  vpc  = true
  tags = { Name = "${var.environment} // ${each.key}" }
}

# The NAT gateway enables instances in private subnets to route traffic out to
# the public internet.
resource "aws_nat_gateway" "this" {
  for_each = local.azs

  subnet_id     = aws_subnet.public[each.key].id
  allocation_id = aws_eip.this[each.key].id
  tags          = { Name = "${var.environment} // ${each.key}" }
}


################################################################################
# Private Subnets
################################################################################

# The private subnet is not directly connected to the public internet. Instead,
# it uses a NAT gateway to route traffic out to the internet. It hosts no public
# facing services.
resource "aws_subnet" "private" {
  for_each = local.azs

  vpc_id            = aws_vpc.this.id
  availability_zone = each.key
  cidr_block        = each.value.private_ipv4_cidr
  tags              = { Name = "${var.environment} // private // ${each.key}" }
}

resource "aws_route_table" "private" {
  for_each = local.azs

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${var.environment} // private // ${each.key}" }

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[each.key].id
  }
}

resource "aws_route_table_association" "private" {
  for_each = local.azs

  route_table_id = aws_route_table.private[each.key].id
  subnet_id      = aws_subnet.private[each.key].id
}


################################################################################
# Security Groups
################################################################################

# The default security group applies to the whole VPC and is configured with the
# necessary rules to enable instances within the VPC to communicate with each
# other, as well as out to the public internet
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.this.id

  egress {
    description = "Allow all outgoing connections"
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    to_port     = 0
  }

  ingress {
    description = "Allow all traffic from the security group"
    protocol    = "-1"
    self        = true
    from_port   = 0
    to_port     = 0
  }
}

# The public security group enables pings and ssh access for anywhere
resource "aws_security_group" "public" {
  vpc_id = aws_vpc.this.id

  ingress {
    description = "Allow incoming pings from anywhere"
    protocol    = "icmp"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 0
    to_port     = 0
  }

  ingress {
    description = "Allow incoming ssh connections from anywhere"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = 22
    to_port     = 22
  }
}

# The private security group enables ssh/pings access within the VPC
resource "aws_security_group" "private" {
  vpc_id = aws_vpc.this.id

  ingress {
    description = "Allow incoming pings within the VPC"
    protocol    = "icmp"
    cidr_blocks = [aws_vpc.this.cidr_block]
    from_port   = 0
    to_port     = 0
  }

  ingress {
    description = "Allow incoming ssh connections within the VPC"
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.this.cidr_block]
    from_port   = 22
    to_port     = 22
  }
}
