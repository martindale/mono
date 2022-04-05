{ modulesPath
, ... }:
{
  imports = [ "${toString modulesPath}/virtualisation/amazon-image.nix" ];
  ec2.hvm = true;
}
