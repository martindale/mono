{system ? builtins.currentSystem}: let
  sources = import ./sources.nix;
in
  import sources.nixpkgs {
    inherit system;
    overlays = [(self: super: {inherit sources;})] ++ import ./overlays;
  }
