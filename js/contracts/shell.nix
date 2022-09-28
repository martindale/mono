{ system ? builtins.currentSystem, pkgs ? import ../../nix { inherit system; }}:
let
  node_modules_attrs = (import ./. {}).passthru.node_modules_attrs;
in pkgs.npmlock2nix.v2.shell {
  inherit node_modules_attrs;
  src = ./.;
  nativeBuildInputs = [ pkgs.solc pkgs.jq pkgs.moreutils ];
  shellHook = ''
    export TRUFFLE_CONF_PATH="$(mktemp)"
    cp truffle-config.json "$TRUFFLE_CONF_PATH"
    jq '.compilers.solc.version="native"' "$TRUFFLE_CONF_PATH" | sponge "$TRUFFLE_CONF_PATH"
  '';
}
