{ system ? "x86_64-linux"
, module ? "empty"
}:
let
  pkgs = import ./nix { inherit system; };

in
{
  nixos = (pkgs.nixos {
    imports = [
      ./nix/modules/aws.nix
      ./nix/modules/bitcoin.nix
      ./nix/modules/default.nix
      ./nix/modules/users.nix
      ./nix/modules/${module}.nix
    ];

    portal.bitcoin.port = 20445;
    portal.bitcoin.rpcPort = 20444;
    portal.ethereum.hostname = "ethereum";
    portal.ethereum.port = 8545;
    portal.nodeFqdn = "nixos";
    portal.rootSshKey = "not-provided";
  }).toplevel;

  playnet = (pkgs.nixos { imports = [
    ./tf/playnet-equinix/nix/node/configuration.nix
    ./nix/configuration.nix
  ]; }).toplevel;
}
