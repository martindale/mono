self: super: {
  raiden =
    let
      inherit (super) lib pkgs sources;

      # Build dependencies
      nodejs = pkgs.nodejs-16_x;
      yarn = pkgs.yarn.override { inherit nodejs; };
      y2n = pkgs.yarn2nix-moretea.override { inherit nodejs yarn; };

      # Raiden source (from nix/sources.json)
      src = sources.raiden;

    in

    y2n.mkYarnWorkspace {
      name = "raiden";
      inherit src;

      buildInputs = with pkgs; [
        gitMinimal
        solc
      ];

      packageOverrides = {
        raiden-ts = {
          patchPhase = ''
            runHook prePatch

            ${pkgs.gitMinimal}/bin/git init
            ${pkgs.gitMinimal}/bin/git submodule init
            ${pkgs.gitMinimal}/bin/git submodule update

            runHook postPatch
          '';
        };

        raiden_network-raiden-cli = {
          distPhase = ''
            yarn run build
            mv build $out/libexec/@raiden_network/raiden-cli/deps/@raiden_network/raiden_cli
          '';
        };
      };
    };
}
