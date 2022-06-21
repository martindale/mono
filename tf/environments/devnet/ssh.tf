################################################################################
# Resources
################################################################################

# Deployment key used by Terraform for remote access
resource "tls_private_key" "deploy" {
  algorithm = "RSA"
  rsa_bits  = 4096
}
