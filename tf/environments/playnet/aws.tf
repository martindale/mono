################################################################################
# Configuration
################################################################################

locals {
  instances = {
    bastion = {
      aws_instance_type = "t3.small"
      aws_subnet        = "public"
      aws_zone          = "us-east-2a"

      aws_security_groups = [
        module.aws_networking.security_groups.default,
        module.aws_networking.security_groups.public
      ]

      aws_volumes = {
        root = { size = 32 }
      }

      configuration = <<-EOF
        {
          imports = [ ${path.module}/../../../nix/modules/bastion.nix ];
        }
      EOF
    }
    bitcoin = {
      aws_instance_type = "t3.small"
      aws_subnet        = "private"
      aws_zone          = "us-east-2a"

      aws_security_groups = [
        module.aws_networking.security_groups.default,
        module.aws_networking.security_groups.public
      ]

      aws_volumes = {
        root = { size = 32 }
      }

      configuration = <<-EOF
        {
          imports = [ ${path.module}/../../../nix/modules/bitcoin.nix ];
        }
      EOF
    }
    raiden = {
      aws_instance_type = "t3.xlarge"
      aws_subnet        = "private"
      aws_zone          = "us-east-2a"

      aws_security_groups = [
        module.aws_networking.security_groups.default,
        module.aws_networking.security_groups.private
      ]

      aws_volumes = {
        root = { size = 32 }
      }

      configuration = <<-EOF
        {
          imports = [ ${path.module}/../../../nix/modules/raiden.nix ];

          # vue-cli-service easily exceeds the 8k default limit
          boot.kernel.sysctl."fs.inotify.max_user_watches" = 524288;
        }
      EOF
    }
  }
}


################################################################################
# Resources
################################################################################

# The public key used by Terraform to deploy infrastructure on AWS
resource "aws_key_pair" "playnet" {
  key_name   = "${var.environment}-deploy_key"
  public_key = tls_private_key.deploy.public_key_openssh
}

# Setup the VPC and associated networking
module "aws_networking" {
  source = "../../modules/networking-aws"

  environment            = var.environment
  aws_vpc_cidr_block     = var.aws_vpc_cidr_block
  aws_availability_zones = ["us-east-2a"]
}

# Provision the instances in the cluster
module "aws_instances" {
  source   = "../../modules/instance-aws"
  for_each = local.instances

  name        = each.key
  environment = var.environment

  aws_ami        = var.aws_ami
  aws_key_pair   = aws_key_pair.playnet
  aws_networking = module.aws_networking

  aws_instance_type   = each.value.aws_instance_type
  aws_subnet          = each.value.aws_subnet
  aws_zone            = each.value.aws_zone
  aws_security_groups = each.value.aws_security_groups
  aws_volumes         = each.value.aws_volumes

  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
}

# Configure the operating system for each instance
module "aws_configuration" {
  source   = "../../modules/nixos"
  for_each = module.aws_instances

  target = {
    key          = tls_private_key.deploy.private_key_pem
    host         = each.value.ipv4_address
    user         = "root"
    bastion_host = each.value.is_public ? null : module.aws_instances.bastion.fqdn
    bastion_user = each.value.is_public ? null : "root"
  }

  triggers = {
    instance = each.value.id
    host     = each.value.fqdn
  }

  configuration = <<-EOF
  {
    imports = [
      ${path.module}/../../../nix/modules/aws.nix
      ${path.module}/../../../nix/modules/default.nix
      ${path.module}/../../../nix/modules/devtools.nix
      ${path.module}/../../../nix/modules/users.nix
      (${local.instances[each.key].configuration})
    ];

    portal.nodeFqdn = "${each.value.fqdn}";
    portal.rootSshKey = "${tls_private_key.deploy.public_key_openssh}";
  }
  EOF
}


################################################################################
# Outputs
################################################################################

output "aws_networking" {
  description = "The AWS networking infrastructure"
  value       = module.aws_networking
}

output "aws_instances" {
  description = "The AWS instances"
  value       = module.aws_instances
}

output "aws_configuration" {
  description = "The nixos configuration deployed on to the instances"
  value       = module.aws_configuration
}
