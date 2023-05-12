{ config, lib, ...}:

with lib;

{
  # TODO: what should be configurable
  options.portal.bitcoin = {};

  config = {
    services.bitcoind.default = {
      enable = true;
      extraConfig = ''
        regtest=1
        '';
    };
  };
}
