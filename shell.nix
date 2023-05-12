{ pkgs ? import ./nix { } }:

pkgs.mkShell {
  packages = with pkgs; [
    portaldefi.nodejs

    bash
    bitcoind
    coreutils
    go-ethereum
    git
    jq
    less
    lnd
    niv
    nix-diff
    terraform
    which
  ];

  shellHook = ''
    ############################################################################
    # Aliases
    ############################################################################
    alias ls='ls --color'
    alias l='ls -la'

    alias tf-get-deploy-private-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.private_key_pem"'
    alias tf-get-deploy-public-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.public_key_openssh"'


    ############################################################################
    # Developer Environment
    ############################################################################
    export PORTAL_ROOT=${toString ./.}
    source $PORTAL_ROOT/sh/devenv.sh
  '';
}
