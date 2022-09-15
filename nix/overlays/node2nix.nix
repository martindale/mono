self: super: {
  node2nix = super.nodePackages.node2nix.override {
    src = super.sources.node2nix;
  };
}
