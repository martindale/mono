{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portaldefi.portal.server;
in
{
  options.portaldefi.portal.server = {
    enable = mkEnableOption "portal";

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

  config = lib.mkIf cfg.enable {
    systemd.services.portal = {
      description = "Portal Server";
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      environment = {
        PORTAL_HTTP_HOSTNAME = cfg.hostname;
        PORTAL_HTTP_PORT = toString cfg.port;
      };
      serviceConfig = {
        DynamicUser = true;
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
