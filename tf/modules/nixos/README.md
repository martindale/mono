# `nixos`

Builds the specified NixOS configuration and deploys it over `ssh` to a target host running NixOS, including automatically rebooting the target, if needed.

## how it works

This module uses an `external` data resource to construct the derivation of the specified NixOS configuration. During the `terraform apply`, it realizes the derivation, and deploys it using `ssh` to the specified NixOS host.
