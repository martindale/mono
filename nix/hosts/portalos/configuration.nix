{lib, ...}:
with lib; {
  imports = [
    ../../modules/bitcoind.nix
    ../../modules/default.nix
    ../../modules/devtools.nix
    ../../modules/geth.nix
    ../../modules/lnd.nix
    ../../modules/nginx.nix
    ../../modules/portal.nix
    ../../modules/users.nix

    ../../modules/lnd-playnet.nix
  ];

  # Fixes deadlock with network manager
  # see: https://github.com/NixOS/nixpkgs/issues/180175#issuecomment-1473408913
  # TODO: Review what to do with this
  systemd.services.NetworkManager-wait-online.enable = lib.mkForce false;
  systemd.services.systemd-networkd-wait-online.enable = lib.mkForce false;

  portal = {
    nodeFqdn = mkDefault "node.playnet.portaldefi.zone";
    rootSshKey = mkDefault "not-provided";
  };
}
