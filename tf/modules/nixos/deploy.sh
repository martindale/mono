#!/usr/bin/env bash
# Builds and copies the NixOS derivation results to a remote host
# Usage: deploy.sh <derivation_path> <host>
set -euo pipefail

sshPrivateKey=$(mktemp)
trap "{ rm -f $sshPrivateKey; }" EXIT
echo "$SSH_PRIVATE_KEY" >"$sshPrivateKey"

################################################################################
# Configuration
################################################################################

DERIVATION_PATH=$1
SSH_HOST=$2

NIX_BUILD_OPTS=(
  --option extra-binary-caches https://cache.nixos.org/
)
NIX_COPY_OPTS=(
  --to
  --gzip
)
NIX_PROFILE=/nix/var/nix/profiles/system
SSH_OPTS=(
  -o "ConnectTimeout=30"
  -o "StrictHostKeyChecking=no"
  -o "UserKnownHostsFile=/dev/null"
  -o "GlobalKnownHostsFile=/dev/null"
  -o "IdentitiesOnly=yes"
  -o "IdentityFile=${sshPrivateKey}"
)

################################################################################
# Helpers
################################################################################

# Log stuff to keep us sane
function log() {
  echo "- $*" >&2
}

# Execute the command on the remote host
function execOnHost() {
  ssh "${SSH_OPTS[@]}" $SSH_HOST "$@"
}

################################################################################
# Preconditions and other checks
################################################################################

# Ensure the local SSH directory exists with appropriate permissions
mkdir -m 0700 -p $HOME/.ssh

# Use the bastion host, if specified
if [ "$#" -eq 3 ]; then
  SSH_OPTS+=("-J" "$3")
fi

# Wait until we can SSH into the host
while ! ssh "${SSH_OPTS[@]}" $SSH_HOST exit; do
  sleep 5
done

# If the remote host has internet access, then use substitute Nix caches
if execOnHost 'ping -c 3 -q cache.nixos.org >/dev/null 2>&1'; then
  log "enabling substitutes for copying nix closure"
  NIX_COPY_OPTS+=("--use-substitutes")
fi

################################################################################
# Build, deploy, activate, clean up and reboot, if needed
################################################################################

log "building the NixOS derivation at ${DERIVATION_PATH}..."
outPath=$(nix-store --realize $DERIVATION_PATH "${NIX_BUILD_OPTS[@]}")

log "uploading the NixOS configuration to host ${SSH_HOST}"
NIX_SSHOPTS="${SSH_OPTS[@]}" nix-copy-closure ${NIX_COPY_OPTS[@]} $SSH_HOST $outPath

log "activating configuration on host ${SSH_HOST}"
execOnHost nix-env --profile $NIX_PROFILE --set $outPath
execOnHost $outPath/bin/switch-to-configuration switch

log "running garbage collection (at least 4GB free) on host ${SSH_HOST}"
totalFree=$(df /nix/store | tail -n 1 | awk '{ print $4 }')
maxFree=$((4 * 1024 ** 3 - 1024 * totalFree))
execOnHost nix-collect-garbage --max-freed $maxFree

runningKernel=$(execOnHost readlink /run/booted-system/kernel)
newKernel=$(execOnHost readlink /run/current-system/kernel)
if [ $newKernel != $runningKernel ]; then
  log "rebooting instance to load new kernel on host ${SSH_HOST}"
  execOnHost reboot || true
fi
