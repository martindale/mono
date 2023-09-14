{
  config,
  lib,
  modulesPath,
  pkgs,
  ...
}:
with lib; {
  imports = [
    "${toString modulesPath}/profiles/minimal.nix"
  ];

  options.portal = {
    nodeFqdn = mkOption {
      description = "The fully-qualified domain name of the node";
      type = types.str;
    };

    nodeName = mkOption {
      description = "The host name of the node";
      type = types.str;
      readOnly = true;
      default = elemAt (splitString "." config.portal.nodeFqdn) 0;
    };

    nodeDomain = mkOption {
      description = "The domain name of the node";
      type = types.str;
      readOnly = true;
      default = concatStrings (
        intersperse "." (drop 1 (splitString "." config.portal.nodeFqdn))
      );
    };

    rootSshKey = mkOption {
      description = "The public key used for secure remote access as `root`";
      type = types.str;
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
      hostName = mkForce config.portal.nodeName;
      domain = config.portal.nodeDomain;
      nameservers = ["1.1.1.1" "1.0.0.1"];
    };

    security.sudo = {
      enable = true;
      wheelNeedsPassword = false;
    };

    services.openssh = {
      enable = true;
      allowSFTP = false;
      hostKeys = [
        {
          type = "ed25519";
          path = "/etc/ssh/ed25519_key";
        }
      ];
      settings.PasswordAuthentication = false;
    };

    time.timeZone = "UTC";

    users.users.root.openssh.authorizedKeys.keys = [config.portal.rootSshKey];
  };
}
