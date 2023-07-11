self: super:

let
  # Change the version of nodejs for this project here
  nodejs = super.nodejs-18_x;

  portal = import ../../js/portal { inherit nodejs; pkgs = super; };

in

  rec {
    portaldefi = {
      inherit nodejs;

      # contracts = import ../../js/contracts { inherit nodejs; pkgs = super; };
      # demo = import ../../js/swap-client { inherit nodejs; pkgs = super; };
      portal = portal.build;
    };

    portaldefi-unit-tests = {
      portal = portal.test;
    };

    portaldefi-integration-tests = {
      portal = import ../vm-tests/portal.nix { pkgs = super; };
    };
  }
