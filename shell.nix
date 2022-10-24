{ pkgs ? import ./nix { } }:
pkgs.mkShell {
  packages = with pkgs; [
    portaldefi.nodejs

    coreutils
    git
    jq
    less
    niv
    nix-diff
    terraform
    which
  ];

  # Needed for macOS, since the TMPDIR path is long there
  TMPDIR = "/tmp";

  shellHook = ''
    # Aliases
    ## Helpers
    alias ls='ls --color'
    alias l='ls -la'

      ## Extracts the deployment key from Terraform
      alias tf-get-deploy-private-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.private_key_pem"'
      alias tf-get-deploy-public-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.public_key_openssh"'
    '';
  }
