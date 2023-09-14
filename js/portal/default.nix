{
  pkgs ? import ../../nix {inherit system;},
  system ? builtins.currentSystem,
  nodejs ? pkgs.portaldefi.nodejs,
}:
pkgs.stdenv.mkDerivation {
  name = "portal";
  version = "0.0.0";

  src = pkgs.nix-gitignore.gitignoreSourcePure [../../.gitignore] ./..;
  sourceRoot = "js/portal";

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
      jq -r '[.dependencies, .devDependencies] | map(select(. != null) | to_entries[] | select(.value | startswith("file:")) | .key)[]' package.json
    }

    # Function to get the path of a given local dependency from package.json.
    function get_dep_path() {
      jq -r "[.dependencies.\"$1\", .devDependencies.\"$1\"] | select(. != null) | .[]" package.json | cut -c 6- | tr -d '\n'
    }

    # Update permissions to be writable on parent folders (required when working with npm link)
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

    # Install the packages
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
    cp -R {bin,contracts,lib,node_modules,package.json} $out

    chmod +x $out/bin/portal
    wrapProgram $out/bin/portal \
      --set NODE_ENV production \
      --set NODE_PATH "$out/node_modules"
  '';
}
