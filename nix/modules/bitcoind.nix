{
  # TODO: Improve original NixOS module implementation of bitcoind
  services.bitcoind = {
    regtest = {
      enable = true;
      rpc = {
        users.lnd.passwordHMAC = "67d3078c31e998da3e5c733272333b53$5fc27bb8d384d2dc6f5b4f8c39b9527da1459e391fb531d317b2feb669724f16";
      };
      extraConfig = ''
        chain=regtest

        zmqpubhashblock=tcp://127.0.0.1:18500
        zmqpubhashtx=tcp://127.0.0.1:18501
        zmqpubrawblock=tcp://127.0.0.1:18502
        zmqpubrawtx=tcp://127.0.0.1:18503
        zmqpubsequence=tcp://127.0.0.1:18504

        fallbackfee=0.0002
      '';
    };
  };
}
