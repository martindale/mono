{ config, lib, modulesPath, options, pkgs, ... }:

with lib;

{
  imports = [
    ./modules/bitcoind.nix
    ./modules/default.nix
    ./modules/devtools.nix
    ./modules/geth.nix
    ./modules/nginx.nix
    ./modules/portal.nix
    ./modules/users.nix
  ];

  portal = {
    nodeFqdn = mkDefault "nixos";
    rootSshKey = mkDefault "not-provided";
  };

}
