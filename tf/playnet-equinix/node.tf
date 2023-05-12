################################################################################
# Local Configuration
################################################################################

locals {
  services  = []
  dns_names = [for name in local.services : "${name}.node.${var.environment}"]
  dns_records = { for name in local.dns_names : name => {
    zone_id = var.cloudflare_zone_id
    ttl     = 60 # TODO: Fix for production use
  } }
}


################################################################################
# Resources
################################################################################

resource "equinix_metal_device" "node" {
  operating_system    = "nixos_21_11"
  plan                = "c3.small.x86"
  project_id          = local.equinix.projects.playnet.id
  project_ssh_key_ids = [equinix_metal_project_ssh_key.deploy.id]

  billing_cycle = "hourly"

  facilities = [
    "sv15",
    "sv16",
    "la4",
    "da11",
    "ch3",
    "dc13"
  ]

  provisioner "local-exec" {
    command = "${path.module}/copy-node-config.sh ${self.access_public_ipv4} ${path.module}/nix/node"
    environment = {
      SSH_PRIVATE_KEY = tls_private_key.deploy.private_key_pem
    }
  }
}

resource "cloudflare_record" "node" {
  zone_id = var.cloudflare_zone_id
  name    = "node.${var.environment}"
  value   = equinix_metal_device.node.access_public_ipv4
  type    = "A"
  ttl     = 60 # TODO: Fix for production use
}

resource "cloudflare_record" "services" {
  for_each = local.dns_records

  name    = each.key
  ttl     = each.value.ttl
  type    = "A"
  value   = equinix_metal_device.node.access_public_ipv4
  zone_id = var.cloudflare_zone_id
}


module "nixos" {
  source = "../modules/nixos"

  target = {
    key  = tls_private_key.deploy.private_key_pem
    host = equinix_metal_device.node.access_public_ipv4
    user = "root"
  }

  triggers = {
    instance = equinix_metal_device.node.id
    host     = cloudflare_record.node.hostname
  }

  configuration = <<-EOF
    { config, lib, ... }: {
      imports = [
        ${path.module}/nix/node/configuration.nix
        ${path.module}/../../nix/configuration.nix
      ];

      # Fixes for the unused NICs on c3.small machines, as suggested by Equinix
      # - https://github.com/NixOS/nixpkgs/issues/10001
      # - https://github.com/NixOS/nixpkgs/issues/30904
      systemd.services.systemd-networkd-wait-online.serviceConfig.ExecStart = [
        ""
        "$${config.systemd.package}/lib/systemd/systemd-networkd-wait-online --any"
      ];

      portal.nodeFqdn = "${cloudflare_record.node.hostname}";
      portal.rootSshKey = "${tls_private_key.deploy.public_key_openssh}";
    }
  EOF
}

################################################################################
# Outputs
################################################################################

output "node" {
  description = "Configuration for the node of the playnet"
  value       = equinix_metal_device.node
  sensitive   = true
}
