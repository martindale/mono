{ config, lib, ...}:

with lib;

{
  # TODO: what should be configurable
  options.portal.ethereum = {};

  config = {
    services.geth = {
      goerli = rec {
        enable = true;
        port = 30000;
        network = "goerli";
        http.enable = true;
        http.port = config.services.geth.goerli.port + 1;
        websocket.enable = true;
        websocket.port = config.services.geth.goerli.port + 2;
        websocket.apis = ["net" "eth"];
        metrics.enable = true;
        metrics.port = config.services.geth.goerli.port + 9;
      };

      ropsten = rec {
        enable = true;
        port = 30010;
        network = "ropsten";
        http.enable = true;
        http.port = config.services.geth.ropsten.port + 1;
        websocket.enable = true;
        websocket.port = config.services.geth.ropsten.port + 2;
        websocket.apis = ["net" "eth"];
        metrics.enable = true;
        metrics.port = config.services.geth.ropsten.port + 9;
      };
    };
  };
}
