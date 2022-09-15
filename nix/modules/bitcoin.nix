{ config, lib, ...}:

with lib;

let
  cfg = config.portal;

in
{
  options.portal.bitcoin = {
    port = mkOption {
      description = "Bitcoin peer-to-peer connection port";
      type = types.port;
    };

    rpcPort = mkOption {
      description = "Bitcoin RPC port";
      type = types.port;
    };
  };

  config = {
    services.bitcoind = {
      enable = true;
      port = cfg.bitcoin.port;
      rpc.port = cfg.bitcoin.rpcPort;
      rpc.users = {
        anand.passwordHMAC = "3cdd75de65026faf9a2a9c22e8ac4fa5$9bf89d4f9ba963c52dd2d16d9ba2a9684b7709c0a4e1b6eeee2402d0320fb66e";
      };
      regtest = true;
      txindex = true;
    };
  };
}
