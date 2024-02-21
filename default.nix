{
  system ? builtins.currentSystem,
  pkgs ? import ./nix {inherit system;},
}: {
  nixosConfigurations = {
    portalos = let
      os = pkgs.nixos {
        imports = [
          ./tf/playnet-equinix/nix/node/configuration.nix
          ./nix/hosts/portalos/configuration.nix
        ];
      };
    in
      os.toplevel;
  };

  packages = {
    inherit (pkgs.portaldefi) app demo portal sdk;
  };

  checks = {
    portaldefi.integration-tests = {
      portal = import ./nix/vm-tests/portal.nix {inherit pkgs;};
      lnd = import ./nix/vm-tests/lnd.nix {inherit pkgs;};
    };
  };
}
