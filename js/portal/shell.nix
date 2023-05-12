{ system ? builtins.currentSystem, pkgs ? import ../../nix { inherit system; }}:

pkgs.npmlock2nix.v2.shell {
  nodejs = pkgs.portaldefi.nodejs;
  src = ./.;

  packages = with pkgs; [
    bitcoind
    coreutils
    go-ethereum
    jq
    lnd
  ];

  shellHook = ''
    export PORTAL_ROOT=${toString ../..}
    source $PORTAL_ROOT/sh/devenv.sh
  '';
}
