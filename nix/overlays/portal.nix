self: super: let
  # Change the version of nodejs for this project here
  nodejs = super.nodejs-18_x;
  pkgs = super;
in {
  portaldefi = {
    inherit nodejs;
    app = import ../../js/app {inherit nodejs pkgs;};
    demo = import ../../js/swap-client {inherit nodejs pkgs;};
    portal = import ../../js/portal {inherit nodejs pkgs;};
    sdk = import ../../js/sdk {inherit nodejs pkgs;};
  };
}
