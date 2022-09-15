self: super:
{
  fabric = super.stdenv.mkDerivation {
    name = "fabric";
    src = super.sources.fabric;

    # Disable the Nix build sandbox for this specific build.
    # This means the build can freely talk to the Internet.
    __noChroot = true;

    buildInputs = with super; [
      nodejs-16_x
      python3
      zeromq
    ];

    buildPhase = ''
      # Nix sets the HOME to something that doesn't exist by default.
      # npm needs a user HOME.
      export HOME=$(mktemp -d)
      export npm_config_zmq_external=true
      npm install
      patchShebangs .
    '';

    installPhase = ''
      mkdir -p $out/bin $out/src
      mv ./* $out/src
      ln -s $out/src/scripts/cli.js $out/bin/fabric
    '';
  };

  faucet = super.stdenv.mkDerivation {
    name = "faucet";
    src = super.sources.faucet;

    # Disable the Nix build sandbox for this specific build.
    # This means the build can freely talk to the Internet.
    __noChroot = true;

    buildInputs = with super; [
      nodejs-16_x
      python3
      zeromq
    ];

    buildPhase = ''
      # Nix sets the HOME to something that doesn't exist by default.
      # npm needs a user HOME.
      export HOME=$(mktemp -d)
      export npm_config_zmq_external=true
      npm install --production
      patchShebangs .
    '';

    installPhase = ''
      mkdir -p $out/src
      mv ./* $out/src
    '';
  };

  /*
  # fabric relies on ZeroMQ, which attempts to download a compiled binary
  # during npm install, which isn't going to fly with Nix's clean sandbox. So
  # we patch the installer to use the ZeroMQ provided by Nix.
  fabric = fabric.package.override (oldAttrs: {
    preRebuild = "export npm_config_zmq_external=true";
    buildInputs = oldAttrs.buildInputs ++ [ self.zeromq ];
  });

  # Faucet has a dependency on @fabric/http, which uses node-gyp-build, which
  # doesn't have its shebang patched to use the appropriate binary in the nix
  # store. See https://github.com/svanderburg/node2nix/issues/275 for details.
  faucet = faucet.package.override (oldAttrs: {
    preRebuild = ''
      export npm_config_zmq_external=true
      sed -i -e "s|#!/usr/bin/env node|#! ${nodejs}/bin/node|" node_modules/@fabric/http/node_modules/node-gyp-build/bin.js
    '';
    buildInputs = oldAttrs.buildInputs ++ [
      self.nodePackages.node-gyp-build
      self.zeromq
    ];
  });
  */
}
