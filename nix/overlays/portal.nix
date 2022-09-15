self: super:
{
  portal = (import ../../js/portal { pkgs = super; }).package;
}
