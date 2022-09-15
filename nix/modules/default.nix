let
  nix-bitcoin = builtins.fetchTarball {
    url = "https://github.com/fort-nix/nix-bitcoin/archive/v0.0.71.tar.gz";
    sha256 = "1f5v8i6bdcg86yf19zqy3cz347shbj8an8difrg6dmb8f41jkgk1";
  };

in

{ config, lib, modulesPath, options, pkgs, ... }:

with lib;

{
  imports = [
    "${toString modulesPath}/profiles/minimal.nix"
    "${nix-bitcoin}/modules/modules.nix"
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
    nix-bitcoin = {
      # Automatically generate all secrets required by services.
      # The secrets are stored in /etc/nix-bitcoin-secrets
      generateSecrets = true;

      # Enable interactive access to nix-bitcoin features (like bitcoin-cli) for
      # your system's main user
      operator = {
        enable = true;
        allowRunAsUsers =
          let
            isDeveloper = name: value: value.group == "users";
          in
            lib.attrNames (lib.filterAttrs isDeveloper config.users.users);
      };
    };

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
      nameservers = [ "1.1.1.1" "1.0.0.1" ];
    };

    security.sudo = {
      enable = true;
      wheelNeedsPassword = false;
    };

    services.openssh = {
      enable = true;
      allowSFTP = false;
      passwordAuthentication = false;
      /* kbdInteractiveAuthentication = false; */
      hostKeys = [ { type = "ed25519"; path = "/etc/ssh/ed25519_key"; } ];
    };

    # Prevent garbage collection of the nix-bitcoin source
    system.extraDependencies = [ nix-bitcoin ];

    time.timeZone = "UTC";

    users.users.root.openssh.authorizedKeys.keys = [config.portal.rootSshKey];
  };
}
