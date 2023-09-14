{
  config,
  lib,
  pkgs,
  ...
}:
with lib; let
  # utils
  script = name: src:
    pkgs.writers.writeBash name ''
      set -eo pipefail
      ${src}
    '';

  rootScript = name: src: "+${script name src}";

  # lnd
  eachLnd = filterAttrs (_: cfg: cfg.enable) config.services.lnd;

  lndOpts = {
    config,
    lib,
    name,
    ...
  }: {
    options = {
      enable = mkEnableOption "Lightning Network daemon, a Lightning Network implementation in Go";

      package = mkOption {
        type = types.package;
        default = pkgs.lnd;
        defaultText = "pkgs.lnd";
        description = "The package providing lnd binaries";
      };

      user = mkOption {
        type = types.str;
        default = "lnd-${name}";
        description = "The user as which to run lnd";
      };

      group = mkOption {
        type = types.str;
        default = config.user;
        description = "The group as which to run lnd";
      };

      dataDir = mkOption {
        type = types.path;
        default = "/var/lib/lnd-${name}";
        description = "The data directory for lnd";
      };

      settings = {
        application = {
          logDir = mkOption {
            type = types.path;
            default = "${config.dataDir}/logs";
            description = "The data directory for storing logs";
          };

          listen = mkOption {
            type = with types; listOf str;
            default = ["127.0.0.1:9735"];
            description = "Specify the interfaces to listen on for REST connections.";
          };

          rpc = {
            listen = mkOption {
              type = with types; listOf str;
              default = ["127.0.0.1:10009"];
              description = "Specify the interfaces to listen on for gRPC connections.";
            };
          };

          rest = {
            enable = mkEnableOption "Enable REST API";

            listen = mkOption {
              type = with types; listOf str;
              default = ["127.0.0.1:8080"];
              description = "Specify the interfaces to listen on for REST connections.";
            };

            cors = mkOption {
              type = with types; nullOr str;
              default = null;
              description = "Domains to allow for cross-origin access in the REST RPC proxy.";
            };

            disableTLS = mkOption {
              type = types.bool;
              default = false;
              description = "Disable TLS for the REST API.";
            };
          };

          tls = {
            certPath = mkOption {
              type = with types; nullOr path;
              default = "${config.dataDir}/tls.cert";
              description = "Path to TLS certificate.";
            };

            keyPath = mkOption {
              type = with types; nullOr path;
              default = "${config.dataDir}/tls.key";
              description = "Path to TLS private key.";
            };

            extraIPs = mkOption {
              type = with types; listOf str;
              default = [];
              description = "Extra IPs for the generated certificate.";
            };

            extraDomains = mkOption {
              type = with types; listOf str;
              default = [];
              description = "Extra domains for the generated certificate.";
            };

            autoRefresh = mkOption {
              type = types.bool;
              default = true;
              description = "Automatically refresh certificates.";
            };

            certDuration = mkOption {
              type = types.str;
              default = "10080h";
              description = "Duration until the self-signed certificate expires.";
            };

            disableAutoFill = mkOption {
              type = types.bool;
              default = false;
              description = "Disable autofill of interface IPs and system hostname in the TLS certificate.";
            };
          };

          wallet = {
            noSeedBackup = mkOption {
              type = types.bool;
              default = false;
              description = "Prevent exposure of seed. For testing only.";
            };

            unlockPasswordFile = mkOption {
              type = with types; nullOr path;
              default = null;
              description = "Path to file containing the wallet unlock password.";
            };

            unlockAllowCreate = mkOption {
              type = types.bool;
              default = false;
              description = "Allow wallet creation if no wallet exists.";
            };

            resetTransactions = mkOption {
              type = types.bool;
              default = false;
              description = "Reset all wallet transactions and rescan the chain.";
            };
          };

          extraConfig = mkOption {
            type = types.lines;
            default = "";
            example = ''
              autopilot.active=1
            '';
            description = ''
              Extra lines appended to {file}`lnd.conf` inside [Application Options] section.
              See here for all available options:
              https://github.com/lightningnetwork/lnd/blob/master/sample-lnd.conf
            '';
          };
        };

        bitcoin = {
          enable = mkEnableOption "Enable Bitcoin";

          chainDir = mkOption {
            type = types.str;
            readOnly = true;
            default = "${config.dataDir}/chain/bitcoin/${config.settings.bitcoin.network}";
            description = "The directory to store the chain's data within.";
          };

          network = mkOption {
            type = types.enum ["mainnet" "testnet" "regtest" "simnet" "signet"];
            default = "mainnet";
            description = "The name of the Bitcoin network to use";
          };

          signetChallenge = mkOption {
            type = types.nullOr types.str;
            default = null;
            description = "Connect to a custom signet network defined by this challenge.";
          };

          signetSeedNode = mkOption {
            type = types.nullOr types.str;
            default = null;
            description = "Specify a seed node for the signet network.";
          };

          node = mkOption {
            type = types.enum ["btcd" "bitcoind" "neutrino"];
            default = "bitcoind";
            description = "The name of the Bitcoin backend to use";
          };

          defaultChanConfs = mkOption {
            type = types.int;
            default = 3;
            description = "The default number of confirmations a channel must have before it's considered open.";
          };

          defaultEmoteDelay = mkOption {
            type = types.int;
            default = 144;
            description = "The default number of blocks for remote delay.";
          };

          maxLocalDelay = mkOption {
            type = types.int;
            default = 2016;
            description = "The maximum number of blocks for local delay.";
          };

          minhtlc = mkOption {
            type = types.int;
            default = 1;
            description = "The smallest HTLC accepted, in millisatoshi.";
          };

          minhtlcout = mkOption {
            type = types.int;
            default = 1000;
            description = "The smallest HTLC sent, in millisatoshi.";
          };

          baseFee = mkOption {
            type = types.int;
            default = 1000;
            description = "The base fee for forwarding payments, in millisatoshi.";
          };

          feeRate = mkOption {
            type = types.int;
            default = 1;
            description = "The fee rate for forwarding payments.";
          };

          timeLockDelta = mkOption {
            type = types.int;
            default = 40;
            description = "The CLTV delta subtracted from a forwarded HTLC's timelock.";
          };

          dnsSeed = mkOption {
            type = types.listOf types.str;
            default = [];
            description = "The seed DNS server(s) for initial peer discovery.";
          };
        };

        bitcoind = {
          enable = mkEnableOption "Whether to enable the Bitcoind service";

          dir = mkOption {
            type = types.str;
            readOnly = true;
            default = "${config.dataDir}/data/bitcoind/${config.settings.bitcoin.network}";
            description = "The base directory that contains the node's data, logs, configuration file, etc.";
          };

          rpcHost = mkOption {
            type = types.str;
            default = "localhost";
            description = "The host that your local bitcoind daemon is listening on.";
          };

          rpcUser = mkOption {
            type = types.str;
            default = "public";
            description = "Username for RPC connections to bitcoind.";
          };

          rpcPass = mkOption {
            type = types.str;
            default = "kek";
            description = "Password for RPC connections to bitcoind.";
          };

          zmqpubrawblock = mkOption {
            type = types.str;
            default = "tcp://127.0.0.1:28332";
            description = "ZMQ socket for rawblock notifications from bitcoind.";
          };

          zmqpubrawtx = mkOption {
            type = types.str;
            default = "tcp://127.0.0.1:28333";
            description = "ZMQ socket for rawtx notifications from bitcoind.";
          };

          estimateMode = mkOption {
            type = types.enum ["ECONOMICAL" "CONSERVATIVE"];
            default = "CONSERVATIVE";
            description = "Fee estimate mode for bitcoind.";
          };

          prunedNodeMaxPeers = mkOption {
            type = types.int;
            default = 4;
            description = "The maximum number of peers to retrieve pruned blocks from.";
          };
        };
      };

      extraConfig = mkOption {
        type = types.lines;
        default = "";
        example = ''
          autopilot.active=1
        '';
        description = ''
          Extra lines appended to {file}`lnd.conf`.
          See here for all available options:
          https://github.com/lightningnetwork/lnd/blob/master/sample-lnd.conf
        '';
      };

      extras = {
        lncli = {
          createAliasedBin = mkEnableOption "Create lncli binary alias for user";

          command = mkOption {
            default = let
              runAsUser = "sudo -u";
            in
              pkgs.writers.writeBashBin "lncli-${name}"
              # Switch user because lnd makes datadir contents readable by user only
              ''
                ${runAsUser} ${config.user} ${config.package}/bin/lncli \
                  --rpcserver ${head config.settings.application.rpc.listen} \
                  --tlscertpath '${config.settings.application.tls.certPath}' \
                  --macaroonpath '${config.extras.macaroons.adminMacaroonPath}' "$@"
              '';
            defaultText = "(See source)";
            description = "Binary to connect with the lnd instance";
          };
        };

        wallet = {
          enableAutoCreate = mkEnableOption "Enable auto creation of wallet";

          walletDir = mkOption {
            type = types.path;
            default = "${config.settings.bitcoin.chainDir}";
            description = "The directory where the wallet will be created";
          };

          walletPassword = mkOption {
            type = with types; nullOr (either path str);
            default = null;
            description = "The password for the lnd wallet. Leave empty to auto-generate.";
          };

          unlockPasswordFile = mkOption {
            readOnly = true;
            default = "${config.extras.wallet.walletDir}/wallet-password";
          };

          seed = mkOption {
            type = with types; nullOr str;
            default = null;
            description = "The seed phrase for the lnd wallet. Leave empty to auto-generate.";
          };

          createWalletScript = mkOption {
            default = let
              lndinit = "${getExe pkgs.lndinit}";
            in
              pkgs.writeScript ''create-wallet.sh'' ''
                walletDir="${config.extras.wallet.walletDir}"

                # Ensure walletDir exists
                mkdir -p "$walletDir"

                if [[ ! -f "$walletDir/wallet.db" ]]; then
                  seedFile="$walletDir/wallet-seed-mnemonic"
                  ${
                  if config.extras.wallet.seed != null
                  then ''
                    echo "Using provided seed"
                    echo '${config.extras.wallet.seed}' > "$seedFile"
                  ''
                  else ''
                    if [[ ! -f "$seedFile" ]]; then
                      echo "Creating lnd seed"
                      (umask u=r,go=; ${lndinit} gen-seed > "$seedFile")
                    fi
                  ''
                }
                  passwordFile="$walletDir/wallet-password"
                  ${
                  if config.extras.wallet.walletPassword != null
                  then ''
                    echo "Using provided wallet password"
                    echo '${config.extras.wallet.walletPassword}' > "$passwordFile"
                  ''
                  else ''
                    echo "Create wallet-password"
                    ${lndinit} gen-password > "$passwordFile"
                  ''
                }
                  echo "Create lnd wallet"
                  ${lndinit} -v init-wallet \
                    --file.seed="$seedFile" \
                    --file.wallet-password="$passwordFile" \
                    --init-file.output-wallet-dir="$walletDir"
                fi
              '';
          };
        };

        macaroons = {
          adminMacaroonPath = mkOption {
            type = types.path;
            default = "${config.settings.bitcoin.chainDir}/admin.macaroon";
            description = "Path where where admin macaroon resides";
          };

          macaroons = mkOption {
            default = {};
            type = with types;
              attrsOf (submodule {
                options = {
                  user = mkOption {
                    type = types.str;
                    description = "User who owns the macaroon";
                  };
                  permissions = mkOption {
                    type = types.str;
                    example = ''
                      {"entity":"info","action":"read"},{"entity":"onchain","action":"read"}
                    '';
                    description = "List of granted macaroon permissions";
                  };
                };
              });
            description = "Extra macaroon definitions";
          };
        };
      };
    };
  };
in {
  # interface
  options = {
    services.lnd = mkOption {
      type = types.attrsOf (types.submodule lndOpts);
      default = {};
      description = "Specification of one or more lnd instances";
    };
  };

  # implementation
  config = mkIf (eachLnd != {}) {
    environment.systemPackages = flatten (
      mapAttrsToList
      (lndName: cfg:
        [cfg.package]
        ++ optional cfg.extras.lncli.createAliasedBin (hiPrio cfg.extras.lncli.command))
      eachLnd
    );

    systemd.tmpfiles.rules = flatten (
      mapAttrsToList
      (lndName: cfg: ["d '${cfg.dataDir}' 0770 '${cfg.user}' '${cfg.group}' - -"])
      eachLnd
    );

    systemd.services =
      mapAttrs' (lndName: cfg: (
        nameValuePair "lnd-${lndName}" (
          let
            configFile = pkgs.writeText "lnd.conf" ''
              [Application Options]
              datadir=${cfg.dataDir}
              logdir=${cfg.settings.application.logDir}

              ; p2p
              ${concatMapStringsSep "\n" (addr: "listen=${addr}") cfg.settings.application.listen}

              ; rpc
              ${concatMapStringsSep "\n" (addr: "rpclisten=${addr}") cfg.settings.application.rpc.listen}

              ; rest
              norest=${boolToString (!(cfg.settings.application.rest.enable))}
              ${concatStringsSep "\n" (map (x: "restlisten=${x}") cfg.settings.application.rest.listen)}
              ${optionalString (cfg.settings.application.rest.cors != null) "restcors=${cfg.settings.application.rest.cors}"}
              ${optionalString cfg.settings.application.rest.disableTLS "no-rest-tls=true"}

              ; tls
              ${optionalString (cfg.settings.application.tls.certPath != null) "tlscertpath=${cfg.settings.application.tls.certPath}"}
              ${optionalString (cfg.settings.application.tls.keyPath != null) "tlskeypath=${cfg.settings.application.tls.keyPath}"}
              ${concatStringsSep "\n" (map (ip: "tlsextraip=${ip}") cfg.settings.application.tls.extraIPs)}
              ${concatStringsSep "\n" (map (domain: "tlsextradomain=${domain}") cfg.settings.application.tls.extraDomains)}
              tlsautorefresh=${boolToString cfg.settings.application.tls.autoRefresh}
              tlscertduration=${cfg.settings.application.tls.certDuration}
              tlsdisableautofill=${boolToString cfg.settings.application.tls.disableAutoFill}

              ; wallet
              noseedbackup=${boolToString cfg.settings.application.wallet.noSeedBackup}
              ${optionalString (
                  if cfg.extras.wallet.enableAutoCreate
                  then cfg.extras.wallet.unlockPasswordFile != null
                  else cfg.settings.application.wallet.unlockPasswordFile != null
                ) "wallet-unlock-password-file=${
                  if cfg.extras.wallet.enableAutoCreate
                  then cfg.extras.wallet.unlockPasswordFile
                  else cfg.settings.application.wallet.unlockPasswordFile
                }"}
              wallet-unlock-allow-create=${boolToString cfg.settings.application.wallet.unlockAllowCreate}
              reset-wallet-transactions=${boolToString cfg.settings.application.wallet.resetTransactions}

              ${cfg.settings.application.extraConfig}

              ${optionalString (cfg.settings.bitcoin.enable) ''
                [Bitcoin]
                bitcoin.active=true
                bitcoin.chaindir=${cfg.settings.bitcoin.chainDir}
                bitcoin.${cfg.settings.bitcoin.network}=true
                bitcoin.node=${cfg.settings.bitcoin.node}
                bitcoin.defaultchanconfs=${toString cfg.settings.bitcoin.defaultChanConfs}
                bitcoin.defaultremotedelay=${toString cfg.settings.bitcoin.defaultEmoteDelay}
                bitcoin.maxlocaldelay=${toString cfg.settings.bitcoin.maxLocalDelay}
                bitcoin.minhtlc=${toString cfg.settings.bitcoin.minhtlc}
                bitcoin.minhtlcout=${toString cfg.settings.bitcoin.minhtlcout}
                bitcoin.basefee=${toString cfg.settings.bitcoin.baseFee}
                bitcoin.feerate=${toString cfg.settings.bitcoin.feeRate}
                bitcoin.timelockdelta=${toString cfg.settings.bitcoin.timeLockDelta}
                ${optionalString (cfg.settings.bitcoin.signetChallenge != null) "bitcoin.signetchallenge=${cfg.settings.bitcoin.signetChallenge}"}
                ${optionalString (cfg.settings.bitcoin.signetSeedNode != null) "bitcoin.signetseednode=${cfg.settings.bitcoin.signetSeedNode}"}
                ${optionalString (cfg.settings.bitcoin.dnsSeed != []) "bitcoin.dnsseed=${concatStringsSep "," cfg.settings.bitcoin.dnsSeed}"}
              ''}

              ${optionalString (cfg.settings.bitcoind.enable) ''
                [Bitcoind]
                bitcoind.dir=${cfg.settings.bitcoind.dir}
                bitcoind.rpchost=${cfg.settings.bitcoind.rpcHost}
                bitcoind.rpcuser=${cfg.settings.bitcoind.rpcUser}
                bitcoind.rpcpass=${cfg.settings.bitcoind.rpcPass}
                bitcoind.zmqpubrawblock=${cfg.settings.bitcoind.zmqpubrawblock}
                bitcoind.zmqpubrawtx=${cfg.settings.bitcoind.zmqpubrawtx}
                bitcoind.estimatemode=${cfg.settings.bitcoind.estimateMode}
                bitcoind.pruned-node-max-peers=${toString cfg.settings.bitcoind.prunedNodeMaxPeers}
              ''}

              ; Extra configuration settings
              ${cfg.extraConfig}
            '';
          in {
            description = "lnd ${lndName}";

            wantedBy = ["multi-user.target"];
            requires = ["bitcoind-${cfg.settings.bitcoin.network}.service"];
            after = ["bitcoind-${cfg.settings.bitcoin.network}.service"];

            preStart = ''
              install -m600 ${configFile} '${cfg.dataDir}/lnd.conf'
              ${optionalString cfg.extras.wallet.enableAutoCreate ''
                ${cfg.extras.wallet.createWalletScript}
              ''}
            '';

            # Following some settings from: https://github.com/lightningnetwork/lnd/blob/90effda090e752662500aa47eaed8b8619687e4e/contrib/init/lnd.service
            serviceConfig = {
              Type = "notify";
              RuntimeDirectory = "lnd-${lndName}"; # Only used to store custom macaroons
              RuntimeDirectoryMode = "711";
              ExecStart = "${cfg.package}/bin/lnd --configfile='${cfg.dataDir}/lnd.conf'";
              User = cfg.user;
              Group = cfg.group;
              TimeoutSec = "1200";
              TimeoutStopSec = "3600";
              Restart = "on-failure";
              RestartSec = "60s";
              ReadWritePaths = [cfg.dataDir];

              ExecStartPost = let
                curl = "${pkgs.curl}/bin/curl -fsS --cacert ${cfg.settings.application.tls.certPath}";
                restUrl = "https://${head cfg.settings.application.rpc.listen}/v1";
              in
                rootScript "lnd-create-macaroons" ''
                  umask ug=r,o=
                  ${concatMapStrings (macaroon: ''
                    echo "Create custom macaroon ${macaroon}"
                    macaroonPath="$RUNTIME_DIRECTORY/${macaroon}.macaroon"
                    ${curl} \
                      -H "Grpc-Metadata-macaroon: $(${pkgs.xxd}/bin/xxd -ps -u -c 99999 '${cfg.extras.macaroons.adminMacaroonPath}')" \
                      -X POST \
                      -d '{"permissions":[${cfg.extras.macaroons.macaroons.${macaroon}.permissions}]}' \
                      ${restUrl}/macaroon |\
                      ${pkgs.jq}/bin/jq -c '.macaroon' | ${pkgs.xxd}/bin/xxd -p -r > "$macaroonPath"
                    chown ${cfg.extras.macaroons.macaroons.${macaroon}.user}: "$macaroonPath"
                  '') (attrNames cfg.extras.macaroons.macaroons)}
                '';

              # Hardening
              PrivateTmp = true;
              ProtectSystem = "strict";
              ProtectHome = true;
              NoNewPrivileges = true;
              PrivateDevices = true;
              MemoryDenyWriteExecute = true;
              ProtectKernelTunables = true;
              ProtectKernelModules = true;
              ProtectKernelLogs = true;
              ProtectClock = true;
              ProtectProc = "invisible";
              ProcSubset = "pid";
              ProtectControlGroups = true;
              # RestrictAddressFamilies = "AF_UNIX AF_INET AF_INET6"; # TODO: If enabled doesn't allow to create the tls certificates
              RestrictNamespaces = true;
              LockPersonality = true;
              # IPAddressDeny = "any"; # TODO: Need to fine tune this
              PrivateUsers = true;
              RestrictSUIDSGID = true;
              RemoveIPC = true;
              RestrictRealtime = true;
              ProtectHostname = true;
              CapabilityBoundingSet = "";
              # @system-service whitelist and docker seccomp blacklist (except for "clone"
              # which is a core requirement for systemd services)
              # @system-service is defined in src/shared/seccomp-util.c (systemd source)
              SystemCallFilter = ["@system-service" "~add_key kcmp keyctl mbind move_pages name_to_handle_at personality process_vm_readv process_vm_writev request_key setns unshare userfaultfd"];
              SystemCallArchitectures = "native";
            };
          }
        )
      ))
      eachLnd;

    users.users =
      mapAttrs' (lndName: cfg: (
        nameValuePair "lnd-${lndName}" {
          description = "Lnd user";
          group = cfg.group;
          home = cfg.dataDir; # lnd creates .lnd dir in HOME
          isSystemUser = true;
          name = cfg.user;
        }
      ))
      eachLnd;

    users.groups =
      mapAttrs' (lndName: cfg: (
        nameValuePair "${cfg.group}" {}
      ))
      eachLnd;
  };
}
