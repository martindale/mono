self: super: {
  terraform =
    let
      inherit (super) lib pkgs sources;

      # validates a terraform provider based on the name of the package
      isTfProvider = name: value: lib.hasPrefix "terraform-provider-" name;

      # filters the (niv) sources to pick all terraform providers
      tfProviders = lib.filterAttrs isTfProvider sources;

      # generates a list of terraform plugins from the terraform providers
      tfPlugins = lib.mapAttrsToList (pname: src: super.buildGoModule {
        inherit pname src;
        inherit (src) vendorSha256 version;

        passthru = src;
        postBuild = "mv $NIX_BUILD_TOP/go/bin/${src.repo}{,_v${src.version}}";
        subPackages = [ "." ];
      }) tfProviders;
    in
      super.terraform.withPlugins (_: tfPlugins ++ (with pkgs; [
        terraform-providers.aws
        terraform-providers.cloudflare
        terraform-providers.equinix
        terraform-providers.external
        terraform-providers.local
        terraform-providers.null
        terraform-providers.tls
      ]));
}
