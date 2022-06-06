self: super: {
  fabric = (import super.sources.fabric { pkgs = super; }).package;
}
