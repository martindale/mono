{config, pkgs, lib, ...}:
with lib;

let
  cfg = config.portal.matrix;
in
{
  options.portal.matrix = {
    domain = mkOption {
      default = "chat.devnet.portaldefi.zone";
      description = "Homeserver domain for Matrix";
      type = types.str;
    };
  
    realm = mkOption {
      default = "turn.devnet.portaldefi.zone";
      description = "Realm for Coturn service";
      type = types.str;
    };
  };

  config = {
    # enable coturn
    services.coturn = rec {
      enable = true;
      no-cli = true;
      no-tcp-relay = true;
      min-port = 49000;
      max-port = 50000;
      use-auth-secret = true;
      static-auth-secret = "will be world readable for local users :(";
      realm = config.portal.matrix.realm;
      cert = "${config.security.acme.certs.${realm}.directory}/full.pem";
      pkey = "${config.security.acme.certs.${realm}.directory}/key.pem";
      extraConfig = ''
        # for debugging
        verbose
        # ban private IP ranges
        no-multicast-peers
        denied-peer-ip=0.0.0.0-0.255.255.255
        denied-peer-ip=10.0.0.0-10.255.255.255
        denied-peer-ip=100.64.0.0-100.127.255.255
        denied-peer-ip=127.0.0.0-127.255.255.255
        denied-peer-ip=169.254.0.0-169.254.255.255
        denied-peer-ip=172.16.0.0-172.31.255.255
        denied-peer-ip=192.0.0.0-192.0.0.255
        denied-peer-ip=192.0.2.0-192.0.2.255
        denied-peer-ip=192.88.99.0-192.88.99.255
        denied-peer-ip=192.168.0.0-192.168.255.255
        denied-peer-ip=198.18.0.0-198.19.255.255
        denied-peer-ip=198.51.100.0-198.51.100.255
        denied-peer-ip=203.0.113.0-203.0.113.255
        denied-peer-ip=240.0.0.0-255.255.255.255
        denied-peer-ip=::1
        denied-peer-ip=64:ff9b::-64:ff9b::ffff:ffff
        denied-peer-ip=::ffff:0.0.0.0-::ffff:255.255.255.255
        denied-peer-ip=100::-100::ffff:ffff:ffff:ffff
        denied-peer-ip=2001::-2001:1ff:ffff:ffff:ffff:ffff:ffff:ffff
        denied-peer-ip=2002::-2002:ffff:ffff:ffff:ffff:ffff:ffff:ffff
        denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
        denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff
      '';
    };

    # open the firewall
    networking.firewall = {
      interfaces.enp2s0 = let
        range = with config.services.coturn; [ {
        from = min-port;
        to = max-port;
      } ];
      in
      {
        allowedUDPPortRanges = range;
        allowedUDPPorts = [ 3478 ];
        allowedTCPPortRanges = range;
        allowedTCPPorts = [ 3478 ];
      };
    };

    security.acme.acceptTerms = true;

    # get a certificate
    security.acme.certs.${config.services.coturn.realm} = {
      /* insert here the right configuration to obtain a certificate */
      postRun = "systemctl restart coturn.service";
      group = "turnserver";
    };

    # configure synapse to point users to coturn
    services.matrix-synapse = with config.services.coturn; {
      settings.turn_uris = ["turn:${realm}:3478?transport=udp" "turn:${realm}:3478?transport=tcp"];
      settings.turn_shared_secret = static-auth-secret;
      settings.turn_user_lifetime = "1h";

      settings.app_service_config_Files = [
        # The registration file is automatically generated after starting the
        # appservice for the first time.
        # cp /var/lib/matrix-appservice-discord/discord-registration.yaml \
        #   /var/lib/matrix-synapse/
        # chown matrix-synapse:matrix-synapse \
        #   /var/lib/matrix-synapse/discord-registration.yaml
        "/var/lib/matrix-synapse/discord-registration.yaml"
        # The registration file is automatically generated after starting the
        # appservice for the first time.
        # cp /var/lib/mautrix-telegram/telegram-registration.yaml \
        #   /var/lib/matrix-synapse/
        # chown matrix-synapse:matrix-synapse \
        #   /var/lib/matrix-synapse/telegram-registration.yaml
        "/var/lib/matrix-synapse/telegram-registration.yaml"
      ];
    };

    services.matrix-appservice-discord = {
      enable = true;
      environmentFile = /etc/keyring/matrix-appservice-discord/tokens.env;
      # The appservice is pre-configured to use SQLite by default.
      # It's also possible to use PostgreSQL.
      settings = {
        bridge = {
          domain = cfg.domain;
          homeserverUrl = "https://${cfg.domain}";
        };

        # The service uses SQLite by default, but it's also possible to use
        # PostgreSQL instead:
        #database = {
        #  filename = ""; # empty value to disable sqlite
        #  connString = "socket:/run/postgresql?db=matrix-appservice-discord";
        #};
      };
    };

    services.mautrix-telegram = {
      enable = true;

      # file containing the appservice and telegram tokens
      environmentFile = "/etc/secrets/mautrix-telegram.env";

      # The appservice is pre-configured to use SQLite by default.
      # It's also possible to use PostgreSQL.
      settings = {
        homeserver = {
          address = "http://localhost:8008";
          domain = "${cfg.domain}";
        };
        appservice = {
          provisioning.enabled = false;
          id = "telegram";
          public = {
            enabled = true;
            prefix = "/public";
            external = "http://${cfg.domain}:8080/public";
          };

          # The service uses SQLite by default, but it's also possible to use
          # PostgreSQL instead:
          #database = "postgresql:///mautrix-telegram?host=/run/postgresql";
        };
        bridge = {
          relaybot.authless_portals = false;

          permissions = {
            "@eric:${cfg.domain}" = "admin";
          };

          # Animated stickers conversion requires additional packages in the
          # service's path.
          # If this isn't a fresh installation, clearing the bridge's uploaded
          # file cache might be necessary (make a database backup first!):
          # delete from telegram_file where \
          #   mime_type in ('application/gzip', 'application/octet-stream')
          animated_sticker = {
            target = "gif";
            args = {
              width = 256;
              height = 256;
              fps = 30;               # only for webm
              background = "020202";  # only for gif, transparency not supported
            };
          };
        };
      };
    };

    systemd.services.mautrix-telegram.path = with pkgs; [
      lottieconverter  # for animated stickers conversion, unfree package
      ffmpeg           # if converting animated stickers to webm (very slow!)
    ];
  };
}
