self: super: {
  portaldefi = {
    contracts = import ../../js/contracts { pkgs = super; };
    portal = import ../../js/portal { pkgs = super; };
  };
}
