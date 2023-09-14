# This file lists user-accounts that are be created on each running instance.
#
# - `createNormalUser()` to create an account for human beings
# - `createSystemUser()` to create service/process accounts
#
# NOTE: User accounts are listed alphabetically. Please preserve this when
# adding new users.
#
{config, ...}: let
  # Creates a regular user account with reasonable defaults
  createNormalUser = name: props: {
    "${name}" =
      props
      // {
        inherit name;

        createHome = true;
        home = "/home/${name}";
        group = "users";
        isNormalUser = true;
        useDefaultShell = true;
      };
  };

  # Creates a system user account with reasonable defaults
  createSystemUser = name: props: {
    "${name}" =
      props
      // {
        inherit name;

        group = "serviceaccounts";
        isSystemUser = true;
      };
  };
in {
  users = {
    groups.serviceaccounts = {};

    # user mutations will not survive past a deployment
    mutableUsers = false;

    # The list of user accounts to be created on each machine
    #
    # See https://search.nixos.org/options?channel=21.11&query=users.users to
    # check out the schema for defining a user.
    users =
      ############
      # Developers
      ############
      # Alexey Melnichenko
      createNormalUser "alexey" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKrpnnVa13It9FW6v2IMDP0jbbtjiW14VtTwba3kAyTe alexey@portaldefi.com"
        ];
      }
      //
      # Anand Suresh
      createNormalUser "anand" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMozgKcmC5KdPFteZey9Ov45/inEfg/PCdSaZKd582tb anand@portaldefi.com"
        ];
      }
      //
      # Casey Bowman
      createNormalUser "casey" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ94FG2tYjhAAaTqHGGlEeI2gY7y8Mhez3S2J6fX1XDo casey@portaldefi.com"
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHpECyxKV36J7+P9hDb3sF7+7FzU/0iR+Q+WSJGgXv5o casey@portaldefi.com"
        ];
      }
      //
      # Farid Azizov
      createNormalUser "farid" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMZoPerJjxh2xCSpPvcXRFoKzTDzTj2jtWOzkjlXEWt+ farid@getportal.co"
        ];
      }
      //
      # Jack Mills
      createNormalUser "jack" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8mkZ7I1Nkemk58rqjkIrj1fG/wxR4zya9WqTjQYuQP jack@getportal.co"
        ];
      }
      //
      # Manoj Duggirala
      createNormalUser "manoj" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILIMf8LBaISQrt1bXWn1mm8ANFPuy50BnTgLlu1MuG3o manoj@portaldefi.com"
        ];
      }
      //
      # Victor Wu
      createNormalUser "victor" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGe8OhFIdO6yUvGF6MHZYJxUv45hN8TmRe3xTMc9c2z3 victor@portaldefi.com"
        ];
      }
      //
      # Aldo Borrero
      createNormalUser "aldo" {
        extraGroups = ["sudo" "wheel"];
        openssh.authorizedKeys.keys = [
          "sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5QG9wZW5zc2guY29tAAAAIGixdPdtzc018TSn5ZjzPSpV2NY55KDoaeiYMngfXiI6AAAAF3NzaDphbGRvQHBvcnRhbGRlZmkuY29t ssh:aldo@portaldefi.com"
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGBgbsWIBrdChA1U9dhejZnQl7eQHFcN4lfpHdpHgDBj aldo@framework"
        ];
      }
      //
      ##################
      # Service Accounts
      ##################
      createSystemUser "terraform" {
        openssh.authorizedKeys.keys = [config.portal.rootSshKey];
      };
  };
}
