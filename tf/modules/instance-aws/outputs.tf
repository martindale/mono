################################################################################
# Outputs
################################################################################

output "id" {
  description = "The AWS instance id"
  value       = aws_instance.this.id
}

output "name" {
  description = "The name of the instance"
  value       = var.name
}

output "fqdn" {
  description = "The private IP address of the instance"
  value       = cloudflare_record.this.hostname
}

output "hostname" {
  description = "The private IP address of the instance"
  value       = cloudflare_record.this.name
}

output "ipv4_address" {
  description = "The private IP address of the instance"
  value       = cloudflare_record.this.value
}

output "is_public" {
  description = "Whether or not the instance is in the private subnet"
  value       = var.aws_subnet == "public"
}
