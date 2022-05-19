{ pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    gitMinimal
    nodejs-12_x
  ];
}
