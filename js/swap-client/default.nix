{ pkgs ? import ../../nix { inherit system; }
, system ? builtins.currentSystem
, nodejs ? pkgs.portaldefi.nodejs
}:

pkgs.npmlock2nix.v2.build {
  inherit nodejs;
  src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./.;
  buildCommands = [ "HOME=$PWD npm run build" ];
  installPhase = "cp -r dist $out";
}
