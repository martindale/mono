################################################################################
# Resources
################################################################################

# Deployment key used by Terraform for remote access
resource "tls_private_key" "deploy" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Terraform deploy key added as a project ssh key on Eqninix ensures it is
# distributed to all machines spun up in the project, allowing for subsequent
# provisioning with Nix
resource "equinix_metal_project_ssh_key" "deploy" {
  name       = "Terraform"
  public_key = tls_private_key.deploy.public_key_openssh
  project_id = local.equinix.projects.playnet.id
}
