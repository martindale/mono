################################################################################
# Outputs
################################################################################

output "vpc" {
  description = "The virtual private cloud used"
  value       = aws_vpc.this
}

output "internet_gateway" {
  description = "The internet gateway used in the VPC"
  value       = aws_internet_gateway.this
}

output "route_tables" {
  description = "A list of route tables used in the VPC"
  value = {
    private = aws_route_table.private
    public  = aws_route_table.public
  }
}

output "subnets" {
  value = {
    private = aws_subnet.private
    public  = aws_subnet.public
  }
}

output "security_groups" {
  description = "A map of security groups used in the VPC"
  value = {
    default = aws_default_security_group.default,
    private = aws_security_group.private
    public  = aws_security_group.public
  }
}
