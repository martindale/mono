{
  imports = [
    {
      boot.kernelModules = ["dm_multipath" "dm_round_robin" "ipmi_watchdog"];
      services.openssh.enable = true;
    }
    {
      boot.initrd.availableKernelModules = [
        "xhci_pci"
        "ahci"
        "usbhid"
        "sd_mod"
      ];

      boot.kernelModules = ["kvm-intel"];
      boot.kernelParams = ["console=ttyS1,115200n8"];
      boot.extraModulePackages = [];
    }
    (
      {lib, ...}: {
        boot.loader.grub.extraConfig = ''
          serial --unit=0 --speed=115200 --word=8 --parity=no --stop=1
          terminal_output serial console
          terminal_input serial console
        '';
        nix.settings.max-jobs = lib.mkDefault 16;
      }
    )
    {
      swapDevices = [
        {
          device = "/dev/disk/by-id/ata-Micron_5300_MTFDDAK480TDT_20422B88C2A3-part2";
        }
      ];

      fileSystems = {
        "/" = {
          device = "/dev/disk/by-id/ata-Micron_5300_MTFDDAK480TDT_20422B88C2A3-part3";
          fsType = "ext4";
        };
      };

      boot.loader.grub.devices = ["/dev/disk/by-id/ata-Micron_5300_MTFDDAK480TDT_20422B88C2A3"];
    }
    {networking.hostId = "10925cf5";}
    (
      {modulesPath, ...}: {
        networking.hostName = "0f055885-packethost-net";
        networking.useNetworkd = true;

        systemd.network.networks."40-bond0" = {
          matchConfig.Name = "bond0";
          linkConfig = {
            RequiredForOnline = "carrier";
            MACAddress = "0c:42:a1:7e:a0:c0";
          };
          networkConfig.LinkLocalAddressing = "no";
          dns = [
            "147.75.207.207"
            "147.75.207.208"
          ];
        };

        boot.extraModprobeConfig = "options bonding max_bonds=0";
        systemd.network.netdevs = {
          "10-bond0" = {
            netdevConfig = {
              Kind = "bond";
              Name = "bond0";
            };
            bondConfig = {
              Mode = "802.3ad";
              LACPTransmitRate = "fast";
              TransmitHashPolicy = "layer3+4";
              DownDelaySec = 0.2;
              UpDelaySec = 0.2;
              MIIMonitorSec = 0.1;
            };
          };
        };

        systemd.network.networks."30-enp2s0f0np0" = {
          matchConfig = {
            Name = "enp2s0f0np0";
            PermanentMACAddress = "0c:42:a1:7e:a0:c0";
          };
          networkConfig.Bond = "bond0";
        };

        systemd.network.networks."30-enp2s0f1np1" = {
          matchConfig = {
            Name = "enp2s0f1np1";
            PermanentMACAddress = "0c:42:a1:7e:a0:c1";
          };
          networkConfig.Bond = "bond0";
        };

        systemd.network.networks."40-bond0".addresses = [
          {
            addressConfig.Address = "139.178.89.125/31";
          }
          {
            addressConfig.Address = "2604:1380:45e3:4f00::5/127";
          }
          {
            addressConfig.Address = "10.67.150.133/31";
          }
        ];
        systemd.network.networks."40-bond0".routes = [
          {
            routeConfig.Gateway = "139.178.89.124";
          }
          {
            routeConfig.Gateway = "2604:1380:45e3:4f00::4";
          }
          {
            routeConfig.Gateway = "10.67.150.132";
          }
        ];
      }
    )
  ];
}
