{
  pkgs ? import ../../nix {inherit system;},
  system ? builtins.currentSystem,
  nodejs ? pkgs.portaldefi.nodejs,
}:
pkgs.stdenv.mkDerivation {
  name = "sdk";
  version = "0.0.0";

  src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./..;
  sourceRoot = "js/sdk";

  __noChroot = true;

  doCheck = false;

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

  NODE_ENV = "production";

  preBuild = ''
    # Extract local dependencies from package.json
    function get_local_deps() {
      jq -r '.dependencies | to_entries[] | select(.value | startswith("file:")) | .key' package.json
    }

    # Function to get the path of a given local dependency from package.json.
    function get_dep_path() {
      jq -r ".dependencies.\"$1\"" package.json | cut -c 6-
    }

    # Update permissions to be writable on parent folders.
    # This is required when working with npm link.
    for dir in ../*/; do
      chmod -R u+w "$dir"
    done

    # Define a temporary home directory for npm so it won't complain.
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

    # Install the primary library's node_modules
    npm install
  '';

  installPhase = ''
    # Create out dir
    mkdir -p "$out"

    # Handle local dependencies:
    # Remove symlinks and copy the actual content of local dependencies
    for dep in $(get_local_deps); do
      dep_path="node_modules/$dep"

      # If a symlink or directory for the local dependency exists, remove it
      [ -e "$dep_path" ] && rm -rf "$dep_path"

      # Ensure the parent directory of the local dependency exists
      mkdir -p "$(dirname "$dep_path")"

      # Copy the actual content of the local dependency
      cp -RT "$(get_dep_path "$dep")" "$dep_path"
    done

    # Copy the relevant files to the build result directory
    cp -R {node_modules,package.json,etc,lib,index.js,index.mjs} "$out"
  '';
}
