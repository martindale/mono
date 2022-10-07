################################################################################
# Resources
################################################################################

resource "equinix_metal_organization" "default" {
  name        = "Portal Defi"
  description = "Your Gateway To Uncensorable Applications"
  twitter     = "@portal_finance"
  website     = "https://portaldefi.com"

  address {
    address  = "2443 Fillmore St"
    city     = "San Francisco"
    state    = "CA"
    zip_code = "94115"
    country  = "US"
  }
}

resource "equinix_metal_project" "playnet" {
  name            = "Playnet"
  organization_id = equinix_metal_organization.default.id
}


################################################################################
# Outputs
################################################################################

output "organizations" {
  description = "A map of organizations and their configurations"
  value = {
    default = equinix_metal_organization.default
  }
}

output "projects" {
  description = "A map of projects and their configurations"
  value = {
    playnet = equinix_metal_project.playnet
  }
}
