{
  pkgs ? import ./nix {},
  lib ? pkgs.lib,
}:
with lib; let
  devshell = import pkgs.sources.devshell {};
  treefmt-nix = import pkgs.sources.treefmt-nix;
in
  devshell.mkShell {
    name = "mono";

    packages = with pkgs; [
      alejandra
      bash
      bitcoind
      coreutils
      git
      go-ethereum
      jq
      less
      lnd
      lsof
      niv
      nix-diff
      nodejs
      process-compose
      terraform
      which
    ];

    env = [
      # Configure nix to use our defined nixpkgs
      {
        name = "NIX_PATH";
        value = "nixpkgs=${toString pkgs.path}";
      }

      # Define PORTAL_ROOT (used by some scripts, although we can use $PRJ_ROOT as well)
      {
        name = "PORTAL_ROOT";
        value = "${toString ./.}";
      }

      # Define PLAYNET_ROOT
      {
        name = "PLAYNET_ROOT";
        value = "${toString ./.}/playnet";
      }
    ];

    commands = [
      {
        category = "DevOps";
        name = "tf-get";
        help = "Obtain the deployment public or private key from terraform state";
        command = let
          script = pkgs.writeShellScriptBin "tf-get" (builtins.readFile ./sh/tf-get.sh);
        in ''${script}/bin/tf-get $@'';
      }
      {
        category = "Tools";
        name = "fmt";
        help = "Format the source tree";
        command = let
          fmt = treefmt-nix.mkWrapper pkgs {
            projectRootFile = ".git/config";
            programs = {
              alejandra.enable = true;
              mdformat.enable = true;
              prettier.enable = false; # TODO: consider using prettier to autoformat code for js/
              shfmt.enable = true;
              terraform.enable = true;
            };
          };
        in ''${fmt}/bin/treefmt'';
      }
      {
        category = "Nix";
        name = "update";
        help = "Update all inputs with niv";
        command = ''${getExe pkgs.niv} update'';
      }
      {
        category = "Dev";
        name = "devenv";
        help = "Development Environment Control Script";
        command = let
          script = pkgs.writeShellScriptBin "devenv" (builtins.readFile ./sh/devenv2.sh);
        in ''${script}/bin/devenv $@'';
      }
    ];

    # TODO: Remove this entry once devenv2 is ready
    devshell.startup.playnet.text = ''[ "$SKIP_OLD_DEVENV" != "true" ] && source "$PORTAL_ROOT/sh/devenv.sh"'';
  }
