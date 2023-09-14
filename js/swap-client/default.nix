{
  pkgs ? import ../../nix {inherit system;},
  system ? builtins.currentSystem,
  nodejs ? pkgs.portaldefi.nodejs,
}:
pkgs.stdenv.mkDerivation {
  name = "swap-client";
  version = "0.0.0";

  # We use a custom gitignore folder that allows copying playnet/state/{alice,bob} folders that are necessary
  src = pkgs.nix-gitignore.gitignoreSourcePure [./.gitignore-nix] ./../..;
  sourceRoot = "mono/js/swap-client";

  __noChroot = true;

  doCheck = false;

  # outputs = ["out" "contracts"];

  buildInputs = [
    nodejs
    pkgs.cacert
    pkgs.git
    pkgs.jq
    pkgs.makeWrapper
    pkgs.openssh
  ];

  # Avoid issues with npm + git when trying to use ssh
  GIT_CONFIG_GLOBAL = pkgs.writeText "gitconfig" ''
    [url "https://github.com/"]
      insteadOf = "ssh://git@github.com/"
  '';

  preBuild = ''
    # Extract local dependencies from package.json
    function get_local_deps() {
      jq -r '[.dependencies, .devDependencies] | map(select(. != null) | to_entries[] | select(.value | startswith("file:")) | .key)[]' package.json
    }

    # Function to get the path of a given local dependency from package.json.
    function get_dep_path() {
      jq -r "[.dependencies.\"$1\", .devDependencies.\"$1\"] | select(. != null) | .[]" package.json | cut -c 6- | tr -d '\n'
    }

    # Update permissions to be writable on parent folders.
    # This is required when working with npm link.
    for dir in ../*/; do
      chmod -R u+w "$dir"
    done

    # npm needs a user HOME.
    export HOME=$(mktemp -d)
  '';

  buildPhase = ''
    runHook preBuild

    # Install local deps (see issue: https://github.com/npm/cli/issues/2339)
    for dep in $(get_local_deps); do
      pushd "$(get_dep_path "$dep")"
      npm install
      popd
    done

    # Include as well core (we need to recursively traverse each file: dep)
    pushd "../core"
    npm install
    popd

    # Install the primary library's node_modules
    npm install

    # Perform the build
    npm run build
  '';

  installPhase = ''
    mkdir -p $out
    cp -r dist/* $out
  '';
}
