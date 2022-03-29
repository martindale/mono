###############################################################################
# Resources
################################################################################

resource "tls_private_key" "deploy" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "deploy" {
  key_name   = "${var.environment}_deploy_key"
  public_key = tls_private_key.deploy.public_key_openssh
}
