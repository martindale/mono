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
      ./nix/modules/default.nix
      ./nix/modules/users.nix
      ./nix/modules/${module}.nix
    ];

    portal.nodeFqdn = "nixos";
    portal.rootSshKey = "not-provided";
  }).toplevel;
}
