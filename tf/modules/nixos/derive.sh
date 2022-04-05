#!/usr/bin/env bash
# Instantiates nix to build derivations
# Usage: derive.sh <nixos> ...
set -euo pipefail

DERIVATION=$(nix-instantiate "$@")

if [[ "$DERIVATION" != /nix/store/*.drv ]]; then
  echo "{\"error\":\"${DERIVATION}\"}"
else
  echo "{\"path\":\"${DERIVATION}\"}"
fi
