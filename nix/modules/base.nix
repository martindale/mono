{ config
, lib
, modulesPath
, options
, pkgs
, ... }:
{
  imports = [ "${toString modulesPath}/profiles/minimal.nix" ];

  options.portal = {
    nodeFqdn = lib.mkOption {
      description = "The fully-qualified domain name of the node";
      type = lib.types.str;
    };

    nodeName = lib.mkOption {
      description = "The name of the node";
      type = lib.types.str;
    };

    rootSshKey = lib.mkOption {
      description = "The public key used for secure remote access as `root`";
      type = lib.types.str;
    };
  };

  config = {
    environment = {
      # enable XLibs to allow building gtk; without this the build fails
      # see https://github.com/NixOS/nixpkgs/issues/102137
      noXlibs = lib.mkForce false;

      systemPackages = with pkgs; [
        coreutils
        htop
        vim
      ];
    };

    networking = {
      firewall.allowedTCPPorts = [ 22 ];
      hostName = config.portal.nodeName;
      nameservers = [ "1.1.1.1" "1.0.0.1" ];
    };

    security.sudo = {
      enable = true;
      wheelNeedsPassword = false;
    };

    services = {
      # ban those pesky bots
      fail2ban.enable = true;

      openssh = {
        enable = true;
        passwordAuthentication = false;
      };
    };

    time.timeZone = "UTC";

    users = {
      mutableUsers = false;
      users.root.openssh.authorizedKeys.keys = [config.portal.rootSshKey];
    };
  };
}
