{ pkgs ? import ../../nix { inherit system; }
, system ? builtins.currentSystem
, nodejs ? pkgs.portaldefi.nodejs
}:

{
  build = pkgs.npmlock2nix.v2.build {
    inherit nodejs;
    src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./.;
    buildCommands = [ ];
    node_modules_attrs.npmExtraArgs = [ "--omit=dev" ];
    installPhase = "cp -r . $out";
  };

  test = pkgs.npmlock2nix.v2.build {
    inherit nodejs;
    src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./.;
    buildCommands = [ "HOME=./ npm run test:unit" ];
    installPhase = "cp -r . $out";
  };
}
