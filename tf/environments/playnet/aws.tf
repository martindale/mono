###############################################################################
# Configuration
################################################################################

locals {
  subnets = {
    "us-east-2a" = {
      availability_zone = "us-east-2a"
      cidr_block        = cidrsubnet(aws_vpc.playnet.cidr_block, 4, 0)
    }
    "us-east-2b" = {
      availability_zone = "us-east-2b"
      cidr_block        = cidrsubnet(aws_vpc.playnet.cidr_block, 4, 1)
    }
    "us-east-2c" = {
      availability_zone = "us-east-2c"
      cidr_block        = cidrsubnet(aws_vpc.playnet.cidr_block, 4, 2)
    }
  }
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
resource "aws_subnet" "playnet" {
  for_each = local.subnets

  availability_zone = each.value.availability_zone
  cidr_block        = each.value.cidr_block
  vpc_id            = aws_vpc.playnet.id

  tags = {
    Name = "${var.environment} // public // ${each.value.availability_zone}"
  }
}

# Spin up the instances to host services in the environment.
resource "aws_instance" "raiden" {
  # TODO: Use the AWS NixOS AMI module to identify this value for the region
  ami                         = "ami-0b20a80b82052d23f"
  associate_public_ip_address = true
  instance_type               = "t3.small"
  key_name                    = aws_key_pair.deploy.key_name
  subnet_id                   = aws_subnet.playnet["us-east-2a"].id

  root_block_device {
    encrypted   = true
    volume_size = 32

    tags = {
      Name = "${var.environment} // raiden // root"
    }
  }

  tags = {
    Name = "${var.environment} // raiden"
  }
}

# Configure NixOS for the instances
module "nixos" {
  source = "../../modules/nixos"

  target = {
    key  = tls_private_key.deploy.private_key_pem
    host = aws_instance.raiden.public_ip
    user = "root"
  }

  triggers = {
    host = aws_instance.raiden.public_ip
  }

  configuration = <<-EOF
  {
    imports = [
      ${path.module}/../../../nix/modules/aws.nix
      ${path.module}/../../../nix/modules/base.nix
      ${path.module}/../../../nix/modules/devtools.nix
    ];

    portal.nodeFqdn = "raiden.playnet.portaldefi.com";
    portal.nodeName = "raiden";
    portal.rootSshKey = "${tls_private_key.deploy.public_key_openssh}";

    services.raiden.goerli = {
      enable = true;
      address = "0xb7f337B1244709aafd9baf50057eD0df934f2076";
      password-file = "/var/lib/raiden/goerli/keystore-pass";
      network-id = "goerli";
      ethereum.rpc-endpoint = "https://goerli.infura.io/v3/3f6691a33225484c8e1eebde034b274f";
      environment-type = "development";
      logging.config = ["console:info"];
      rpc.enable = true;
      path-finding.enable = true;
    };
  }
  EOF

  depends_on = [aws_instance.raiden]
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
    subnets          = aws_subnet.playnet
    instance         = aws_instance.raiden
  }
}
