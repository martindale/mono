{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portal.server;

in
{
  options.portal.server = {
    hostname = mkOption {
      description = "The interface/IP address to listen on";
      type = types.str;
      default = "localhost";
    };

    port = mkOption {
      description = "The TCP port to listen on for incoming HTTP requests";
      type = types.port;
      default = 1337;
    };
  };

  config = {
    systemd.services.portal = {
      description = "Portal Server";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      environment = {
        PORTAL_HTTP_HOSTNAME = cfg.hostname;
        PORTAL_HTTP_PORT = toString cfg.port;
      };
      script = "${pkgs.portaldefi.portal}/lib/node_modules/@portal/portal/bin/portal";
      serviceConfig = {
        DynamicUser = true;
        Restart = "always";
        StateDirectory = "portal";
        # Basic Hardening measures
        NoNewPrivileges = "true";
        PrivateDevices = "true";
        PrivateTmp = "true";
        ProtectSystem = "full";
      };
    };
  };
}
