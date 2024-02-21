{
  config,
  lib,
  pkgs,
  ...
}:
with lib; let
  cfg = config.portaldefi.portal.server;
  cfgEthereum = config.services.geth.default;

  # TODO: Harcoded values for contracts for now, it should come from custom derivation
  contracts = ../../playnet/contracts.json;
in {
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
    environment.systemPackages = [pkgs.portaldefi.demo];

    systemd.services.portal = {
      description = "Portal Server";
      wantedBy = ["multi-user.target"];
      after = [
        "network.target"
        "bitcoind-regest.service" # TODO: Don't hardcode this value, obtain it properly from defined service
        "geth-default.service" # TODO: Don't hardcode this value, obtain it properly from defined service
      ];
      environment = {
        PORTAL_HTTP_ROOT = toString pkgs.portaldefi.demo;
        PORTAL_HTTP_HOSTNAME = cfg.hostname;
        PORTAL_HTTP_PORT = toString cfg.port;

        PORTAL_ETHEREUM_URL = "ws://${cfgEthereum.http.address}:${toString cfgEthereum.http.port}";
        PORTAL_ETHEREUM_CHAINID = "0x539";
        PORTAL_ETHEREUM_CONTRACTS = contracts; # pkgs.portaldefi.demo.contracts
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
