{ system ? builtins.currentSystem, pkgs ? import ../../nix { inherit system; }}:

pkgs.npmlock2nix.v2.shell {
  src = ./.;
}
