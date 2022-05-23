let
  nix-bitcoin = builtins.fetchTarball {
    url = "https://github.com/fort-nix/nix-bitcoin/archive/v0.0.71.tar.gz";
    sha256 = "1f5v8i6bdcg86yf19zqy3cz347shbj8an8difrg6dmb8f41jkgk1";
  };

in
{ config, lib, ...}:
{
  imports = [
    "${nix-bitcoin}/modules/modules.nix"
  ];

  nix-bitcoin = {
    # Automatically generate all secrets required by services.
    # The secrets are stored in /etc/nix-bitcoin-secrets
    generateSecrets = true;

    # Enable interactive access to nix-bitcoin features (like bitcoin-cli) for
    # your system's main user
    operator = {
      enable = true;
      allowRunAsUsers =
        let
          isDeveloper = name: value: value.group == "users";
        in
          lib.attrNames (lib.filterAttrs isDeveloper config.users.users);
    };
};

  # Enable some services.
  # See ./configuration.nix for all available features.
  services = {
    bitcoind = {
      enable = true;
      port = 20445;
      rpc.port = 20444;
      rpc.users = {
        ahp7iuGhae8mooBahFaYieyaixei6too = {
          passwordHMAC = "f95f1bf543284281e993556554a48da5$32624e5550ad6d2b45d26b89416d705b2524b5c9d69c00fb6a9e654f876a99b1";
        };
      };
      regtest = true;
      txindex = true;
    };

    clightning.enable = true;
  };

  # Prevent garbage collection of the nix-bitcoin source
  system.extraDependencies = [ nix-bitcoin ];
}
