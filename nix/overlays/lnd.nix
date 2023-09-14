# Downgraded for now until version 0.17 launches.
#   - See issue: https://github.com/lightningnetwork/lnd/pull/7678
#   - See issue: https://github.com/fort-nix/nix-bitcoin/pull/620
self: super: {
  lnd = super.callPackage ../pkgs/lnd {};
}
