{ config, lib, ...}:

with lib;

let
  cfg = config.portal;

in
{
  options.portal.ethereum = {
    hostname = mkOption {
      description = "Ethereum hostname";
      type = types.str;
      default = "ethereum.${config.networking.hostName}.${config.networking.domain}";
    };

    port = mkOption {
      description = "Ethereum RPC port";
      type = types.port;
    };
  };

  config = {
    services.geth.playnet = {
      enable = true;
      network = "goerli";
      http.enable = true;
      http.port = cfg.ethereum.port;
      metrics.enable = true;
      extraArgs = [
        "--http.vhosts"
        "localhost,${cfg.ethereum.hostname}"
      ];
    };
  };
}
