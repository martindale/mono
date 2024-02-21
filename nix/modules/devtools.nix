{pkgs, ...}: {
  environment.systemPackages = with pkgs; [
    gitMinimal
  ];
}
