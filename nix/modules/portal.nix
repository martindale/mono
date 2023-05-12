{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portaldefi.portal.server;

  cfgBitcoin = config.services.bitcoind.default;
  cfgEthereum = config.services.geth.default;

in
{
  options.portaldefi.portal.server = {
    hostname = mkOption {
      description = "The interface/IP address to listen on";
      type = types.str;
      default = "127.0.0.1";
    };

    port = mkOption {
      description = "The TCP port to listen on for incoming HTTP requests";
      type = types.port;
      default = 1337;
    };
  };

  config = {
    environment.systemPackages = [ pkgs.portaldefi.demo ];

    systemd.services.portal = {
      description = "Portal Server";
      wantedBy = [ "multi-user.target" ];
      after = [
        "network.target"
        "bitcoind-default.service"
        "geth-default.service"
      ];
      environment = {
        PORTAL_HTTP_ROOT = toString pkgs.portaldefi.demo;
        PORTAL_HTTP_HOSTNAME = cfg.hostname;
        PORTAL_HTTP_PORT = toString cfg.port;

        PORTAL_GOERLI_URL = "http://${cfgEthereum.http.address}:${toString cfgEthereum.http.port}";
        PORTAL_GOERLI_CONTRACT_ADDRESS=config.portal.ethereum.swapContractAddress;

        PORTAL_SEPOLIA_URL = "http://${cfgEthereum.http.address}:${toString cfgEthereum.http.port}";
        PORTAL_SEPOLIA_CONTRACT_ADDRESS=config.portal.ethereum.swapContractAddress;
      };
      serviceConfig = {
        # Dynamic user prevents connection to geth
        # DynamicUser = true;
        Restart = "always";
        StateDirectory = "portal";
        ExecStart = "${pkgs.portaldefi.portal}/bin/portal";
        # Basic Hardening measures
        NoNewPrivileges = "true";
        PrivateDevices = "true";
        PrivateTmp = "true";
        ProtectSystem = "full";
      };
    };
  };
}
