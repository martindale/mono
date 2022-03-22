let
  pkgs = import ./nix {};
in
  pkgs.mkShell {
    nativeBuildInputs = with pkgs; [
      coreutils
      git
      less
      niv
      which
    ];

    shellHook = ''
      # Needed for macOS, since the TMPDIR path is long there
      export TMPDIR=/tmp
    '';
  }
