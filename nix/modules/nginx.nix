{ config, lib, pkgs, ...}:

with lib;

let
  cfg = config.portal;


in
{
  options.portal.nginx = {
    email = mkOption {
      description = "Email address used for notifications";
      type = types.str;
      default = "anand+acme@portaldefi.com";
    };

    hosts = mkOption {
      description = "A set of hosts being TLS-terminated, keyed by service";
      type = types.attrs;
      default = {
        goerli = {
          locations."/".proxyPass = "http://localhost:${toString config.services.geth.goerli.http.port}/";
        };
        ropsten = {
          locations."/".proxyPass = "http://localhost:${toString config.services.geth.ropsten.http.port}/";
        };
      };
    };
  };

  config = {
    networking.firewall.allowedTCPPorts = [ 80 443 ];

    security.acme = {
      acceptTerms = true;
      email = cfg.nginx.email;
      certs."${cfg.nodeFqdn}" = {
        webroot = "/var/lib/acme/acme-challenge";
        extraDomainNames =
          let
            fqdn = name: "${name}.${cfg.nodeFqdn}";
          in
            map fqdn (attrNames cfg.nginx.hosts);
      };
    };

    # Terminate TLS for all HTTP services
    services.nginx = {
      enable = true;

      # Use recommended settings
      recommendedGzipSettings = true;
      recommendedOptimisation = true;
      recommendedProxySettings = true;
      recommendedTlsSettings = true;

      # Configure proxying of requests
      virtualHosts = {
        "${cfg.nodeFqdn}" = {
          forceSSL = true;
          enableACME = true;
          locations."/".proxyPass = "http://${cfg.server.hostname}:${toString cfg.server.port}/";
        };
      } // mapAttrs' (name: config: nameValuePair "${name}.${cfg.nodeFqdn}" ({
        forceSSL = true;
        enableACME = true;
        } // config)) cfg.nginx.hosts;
    };

    # /var/lib/acme/.challenges must be writable by the ACME user and readable
    # by the Nginx user. The easiest way to achieve this is to add the Nginx
    # user to the ACME group.
    users.users.nginx.extraGroups = [ "acme" ];
  };
}
