{ config, lib, modulesPath, options, pkgs, ... }:

with lib;

{
  imports = [
    ./modules/default.nix
    ./modules/devtools.nix
    ./modules/geth.nix
    ./modules/nginx.nix
    ./modules/portal.nix
    ./modules/users.nix
  ];

  portal.nodeFqdn = mkDefault "nixos";
  portal.rootSshKey = mkDefault "not-provided";
}
