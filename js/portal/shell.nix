{ system ? builtins.currentSystem, pkgs ? import ../../nix { inherit system; }}:

pkgs.npmlock2nix.v2.shell {
  nodejs = pkgs.portaldefi.nodejs;

  src = ./.;
}
