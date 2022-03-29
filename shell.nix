let
  pkgs = import ./nix {};
in
  pkgs.mkShell {
    nativeBuildInputs = with pkgs; [
      coreutils
      git
      less
      niv
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
      else
        echo "Developer environment not setup correctly!"
        echo "Please setup your environment before proceeding by running:"
        echo
        echo "cat > $PORTAL <<-EOF"
        echo "# This file sets up the security credentials for needed for"
        echo "# deploying resources in the Portal Terraform code-base."
        echo
        echo "# Your settings/credentials go below."
        echo "EOF"
        exit 1
      fi
    '';
  }
