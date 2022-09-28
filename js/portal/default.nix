{ pkgs ? import ../../nix { inherit system; }
, system ? builtins.currentSystem
}:

pkgs.npmlock2nix.v2.build {
  src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./.;
  nodejs = pkgs.nodejs-16_x;
  buildCommands = [];
  installPhase = "cp -r . $out";
}
