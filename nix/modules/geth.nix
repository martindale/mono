{lib, ...}:
with lib; {
  # TODO: what should be configurable
  options.portal.ethereum = {
    swapContractAddress = mkOption {
      description = "The address of the Swap contract";
      type = types.str;
      default = "0xe2f24575862280cf6574db5b9b3f8fe0be84dc62";
    };
  };

  config = {
    services.geth.default = {
      enable = true;
      extraArgs = ["--dev"];
      port = 30303;

      http.enable = true;
      http.port = 8545;

      websocket.enable = true;
      websocket.port = 8546;
    };
  };
}
