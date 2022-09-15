{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portal.fabric;

in
{
  options.portal.faucet = {
    port = mkOption {
      description = "Faucet UI port";
      type = types.port;
      default = 7222;
    };
  };

  config = {
    environment.systemPackages = [ pkgs.faucet ];
  };
}
