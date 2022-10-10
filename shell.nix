let
  pkgs = import ./nix {};
in
  pkgs.mkShell {
    nativeBuildInputs = with pkgs; [
      coreutils
      git
      jq
      less
      niv
      nix-diff
      nodejs-16_x
      terraform
      which
    ];

    shellHook = ''
      # Needed for macOS, since the TMPDIR path is long there
      export TMPDIR=/tmp

      # Configuration file to setup
      export PORTAL=$HOME/.config/portal.conf
      if [ -f $PORTAL ]; then
        source $PORTAL
      elif [ ! $CI ]; then
        echo "Developer environment not setup correctly!"
        echo "Please setup your environment before proceeding by running:"
        echo
        echo "cat > $PORTAL <<-EOF"
        echo "# This file sets up the security credentials for needed for"
        echo "# deploying resources in the Portal Terraform code-base."
        echo
        echo "# Your settings/credentials go below."
        echo "export AWS_ACCESS_KEY_ID='your_aws_access_key_id'"
        echo "export AWS_SECRET_ACCESS_KEY='your_aws_secret_access_key'"
        echo
        echo "export CLOUDFLARE_EMAIL='your_cloudflare_email_address'"
        echo "export CLOUDFLARE_API_KEY='your_cloudflare_global_api_key'"
        echo
        echo "export METAL_AUTH_TOKEN='your_equinix_metal_api_token'"
        echo "EOF"
        exit 1
      fi

      # Aliases
      ## Helpers
      alias ls='ls --color'
      alias l='ls -la'

      ## Extracts the deployment key from Terraform
      alias tf-get-deploy-private-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.private_key_pem"'
      alias tf-get-deploy-public-key='terraform state pull | jq -r ".resources[] | select(.name == \"deploy\") | .instances[0].attributes.public_key_openssh"'
    '';
  }
