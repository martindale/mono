{pkgs ? import ../. {}}:
pkgs.nixosTest {
  name = "lnd-vm-test";

  nodes = {
    lnd = {
      nodes,
      pkgs,
      config,
      ...
    }: {
      imports = [
        ../modules/lnd.nix
      ];

      networking.firewall.enable = false;

      services = {
        bitcoind = {
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

        lnd = {
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
      };
    };
  };

  testScript = {nodes, ...}: ''
    def verify_services():
      # Wait for systemd units
      lnd.wait_for_unit("bitcoind-regtest.service")
      lnd.wait_for_unit("lnd-alice.service")
      lnd.wait_for_unit("lnd-bob.service")

      # Verify ports are active
      for port in [9001, 10001, 9002, 10002]:
        lnd.wait_for_open_port(port)

      # Verify RPC Functionality
      lnd.succeed("lncli-alice getinfo")
      lnd.succeed("lncli-bob getinfo")

    def restart_and_verify_services():
      # Restart services
      lnd.succeed("systemctl restart lnd-alice.service")
      lnd.succeed("systemctl restart lnd-bob.service")

      # Re-verify
      verify_services()

    lnd.start()

    # Initial verification
    verify_services()

    # Validate Wallet Creation
    lnd.succeed("test -f /var/lib/lnd-alice/chain/bitcoin/regtest/wallet.db")
    lnd.succeed("test -f /var/lib/lnd-bob/chain/bitcoin/regtest/wallet.db")

    # Restart services and re-verify
    restart_and_verify_services()
  '';
}
