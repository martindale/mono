{pkgs ? import ../. {}}: let
  test-portal = pkgs.writeScriptBin "test-portal" ''
    set -eux
    endpoint="https://portal.portaldefi.com/api/v1/alive"
    # The node service might be considered as ready by systemd by not
    # yet listening to the input socket. Let's wait until it's ready.
    # Note: the nixos test has a 900s timeout.
    while [[ "$(curl -s -o /dev/null -w '%{http_code}' "$endpoint")" != "200" ]]; do sleep 5; done
    res_code=$(curl -s -o /dev/null -w '%{http_code}' "$endpoint")
    res_expected_body=$(curl -s "$endpoint" | jq ".alive")
    if [[ $res_code == 200 && $res_expected_body == true  ]]; then
      echo "[+] The portal seems to be up and running!"
      exit 0
    else
      echo "ERROR: cannot query the portal. Errcode: $code"
      exit 1
    fi
  '';

  tls-cert = pkgs.runCommand "selfSignedCerts" {buildInputs = [pkgs.openssl];} ''
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -nodes -subj '/CN=portal.portaldefi.com' -days 36500
    mkdir -p $out
    cp key.pem cert.pem $out
  '';

  hosts = nodes: ''
    ${nodes.portal.networking.primaryIPAddress} portal.portaldefi.com
    ${nodes.client.networking.primaryIPAddress} client.portaldefi.com
  '';
in
  pkgs.nixosTest {
    name = "portal-vm-test";

    nodes = {
      client = {
        nodes,
        pkgs,
        config,
        ...
      }: {
        environment.systemPackages = with pkgs; [curl jq test-portal];
        security.pki.certificateFiles = ["${tls-cert}/cert.pem"];
        networking.extraHosts = hosts nodes;
      };

      portal = {
        nodes,
        pkgs,
        config,
        ...
      }: {
        imports = [
          ../modules/geth.nix
          ../modules/lnd.nix
          ../modules/portal.nix
        ];

        security.pki.certificateFiles = ["${tls-cert}/cert.pem"];

        networking = {
          extraHosts = hosts nodes;
          firewall.enable = false;
        };

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

          nginx = {
            enable = true;
            virtualHosts."portal.portaldefi.com" = {
              addSSL = true;
              sslCertificate = "${tls-cert}/cert.pem";
              sslCertificateKey = "${tls-cert}/key.pem";
              locations."/" = {
                proxyPass = "http://${config.portaldefi.portal.server.hostname}:${toString config.portaldefi.portal.server.port}";
              };
            };
          };
        };
      };
    };

    testScript = {nodes, ...}: ''
      def wait_for_units(node, units):
        for unit in units:
          node.wait_for_unit(unit)

      def check_ports(node, ports):
        for port in ports:
          node.wait_for_open_port(port)

      start_all()

      # Service Status
      wait_for_units(portal, ["portal.service", "nginx.service", "bitcoind-regtest.service", "lnd-bob.service", "lnd-alice.service"])
      client.wait_for_unit("multi-user.target")

      # Port Accessibility
      check_ports(portal, [9001, 9002, 18500])

      # Check Portal starts
      client.succeed("test-portal")

      # Data Persistence
      portal.succeed("test -f /var/lib/lnd-alice/chain/bitcoin/regtest/wallet.db")
      portal.succeed("test -f /var/lib/lnd-bob/chain/bitcoin/regtest/wallet.db")

      # Error Logs
      portal.fail("journalctl -u portal.service | grep -i 'error'")
      portal.fail("journalctl -u nginx.service | grep -i 'error'")
    '';
  }
