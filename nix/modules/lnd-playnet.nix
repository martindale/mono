{
  # TODO: This will configured per host. As right now we only have the definition of portalos, here's enough.
  services.lnd = {
    alice = {
      enable = true;
      settings = {
        application = {
          listen = ["127.0.0.1:9001"];
          rpc.listen = ["127.0.0.1:10001"];
        };
        bitcoin = {
          enable = true;
          network = "regtest";
        };
        bitcoind = {
          enable = true;
          rpcUser = "lnd";
          rpcPass = "lnd";
          zmqpubrawblock = "tcp://127.0.0.1:18502";
          zmqpubrawtx = "tcp://127.0.0.1:18503";
        };
      };
      extras = {
        lncli.createAliasedBin = true;
        wallet.enableAutoCreate = true;
      };
    };

    bob = {
      enable = true;
      settings = {
        application = {
          listen = ["127.0.0.1:9002"];
          rpc.listen = ["127.0.0.1:10002"];
        };
        bitcoin = {
          enable = true;
          network = "regtest";
        };
        bitcoind = {
          enable = true;
          rpcUser = "lnd";
          rpcPass = "lnd";
          zmqpubrawblock = "tcp://127.0.0.1:18502";
          zmqpubrawtx = "tcp://127.0.0.1:18503";
        };
      };
      extras = {
        lncli.createAliasedBin = true;
        wallet.enableAutoCreate = true;
      };
    };
  };
}
