{ config, lib, options, ...}:

with lib;

let
  cfg = config.portal.bitcoin;

in
{
  options.portal.bitcoin = {
    network = mkOption {
      description = "";
      type = types.enum ["mainnet" "regtest"];
      default = "regtest";
    };

    port = mkOption {
      description = "The port to listen on for incoming connections";
      type = types.int;
      default = 20445;
    };

    portRpc = mkOption {
      description = "The port to listen on for incoming connections";
      type = types.int;
      default = 20444;
    };

    fallbackFee = mkOption {
      readOnly = true;
      type = types.float;
      default = 0.00001;
    };
  };

  config = {
    services.bitcoind.playnet = {
      enable = true;

      port = cfg.port;
      rpc.port = cfg.portRpc;

      testnet = cfg.network == "regtest";
      extraConfig = optionalString (cfg.network == "regtest") ''
        regtest=1
      '' + ''
        server=1
        txindex=1
        fallbackfee=${toString cfg.fallbackFee}
      '';
      rpc.users = {
        ahp7iuGhae8mooBahFaYieyaixei6too.passwordHMAC = "f95f1bf543284281e993556554a48da5$32624e5550ad6d2b45d26b89416d705b2524b5c9d69c00fb6a9e654f876a99b1";
      };
    };

    systemd.tmpfiles.rules = mapAttrsToList (user: props:
        "L /var/lib/bitcoind-playnet/bitcoin.conf 440 ${user} ${props.group} - ${props.home}/.bitcoin"
    ) (filterAttrs (n: v: v.group == "users") config.users.users);
  };
}
