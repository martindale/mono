{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portal.fabric;

in
{
  options.portal.fabric = {};

  config = {
    environment.systemPackages = [ pkgs.fabric ];
  };
}
