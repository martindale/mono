{configuration}: let
  pkgs = import ../../../nix {system = "x86_64-linux";};
  build = pkgs.nixos {imports = [configuration];};
in
  build.toplevel
