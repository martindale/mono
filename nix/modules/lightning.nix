{ config, lib, ...}:

with lib;

let
  cfg = config.portal.lightning;

in
{
  options.portal.lightning = {};

  config = {
    services = {
      clightning.enable = true;
      clightning-rest.enable = true;
    };
  };
}
