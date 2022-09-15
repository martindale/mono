{ config, lib, modulesPath, options, pkgs, ... }:

with lib;

{
  imports = [
    ./modules/default.nix
    ./modules/bitcoin.nix
    ./modules/devtools.nix
    ./modules/geth.nix
    ./modules/nginx.nix
    ./modules/users.nix
  ];

  portal.bitcoin.port = mkDefault 20445;
  portal.bitcoin.rpcPort = mkDefault 20444;
  portal.ethereum.hostname = mkDefault "ethereum";
  portal.ethereum.port = mkDefault 8545;
  portal.nodeFqdn = mkDefault "nixos";
  portal.rootSshKey = mkDefault "not-provided";
}
