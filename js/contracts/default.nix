{ pkgs ? import ../../nix { inherit system; }
, nodejs ? pkgs.portaldefi.nodejs
, system ? builtins.currentSystem
}:

let
  node_modules_attrs = {
    sourceOverrides = with pkgs.npmlock2nix.v2.node_modules; {
      "ganache" = packageRequirePatchShebangs;
    };
  };

in

pkgs.npmlock2nix.v2.build {
  inherit node_modules_attrs nodejs;

  src = pkgs.nix-gitignore.gitignoreSourcePure [./.gitignore] ./.;
  buildCommands = ["HOME=$PWD npm run build"];
  nativeBuildInputs = [ pkgs.solc pkgs.jq pkgs.moreutils ];
  installPhase = "cp -r build/* $out";
  prePatch = ''
    # Patching the truffle config. We want to use the nixpkgs-provided solc
    # compiler instead of using the truffle-provided one.
    jq '.compilers.solc.version="native"' truffle-config.json | sponge truffle-config.json

    # Patching the contracts solidity pragmas.
    # For some reason, the nixpkgs-solc is failing to parse its own version.
    # TODO: fix the nixpkgs solc derivation.
    for contract in contracts/*; do
      sed -i 's/pragma solidity.*$/pragma solidity *;/g' "$contract"
    done
  '';
  passthru.node_modules_attrs = node_modules_attrs;
}
