terraform {
  required_providers {
    aws        = { source = "hashicorp/aws" }
    cloudflare = { source = "cloudflare/cloudflare" }
  }
}


################################################################################
# Resources
################################################################################

locals {
  is_public  = var.aws_subnet == "public"
  is_private = var.aws_subnet == "private"
}

resource "aws_instance" "this" {
  ami                    = var.aws_ami
  instance_type          = var.aws_instance_type
  key_name               = var.aws_key_pair.key_name
  subnet_id              = var.aws_networking.subnets[var.aws_subnet][var.aws_zone].id
  vpc_security_group_ids = var.aws_security_groups[*].id

  root_block_device {
    encrypted   = true
    volume_size = var.aws_volumes.root.size

    tags = {
      Name = "${var.environment} // ${var.name} // root"
    }
  }

  tags = {
    Name = "${var.environment} // ${var.name}"
  }
}

resource "cloudflare_record" "this" {
  zone_id = var.cloudflare_zone_id
  name    = "${var.name}.${var.environment}"
  value   = aws_instance.this["${var.aws_subnet}_ip"]
  type    = "A"
  ttl     = 60 # TODO: Fix for production use
}
