#!/usr/bin/env bash
set -euo pipefail

sshPrivateKey=$(mktemp)
trap "{ rm -f $sshPrivateKey; }" EXIT
echo "$SSH_PRIVATE_KEY" >"$sshPrivateKey"

REMOTE_HOST="$1"
LOCAL_PATH="$2"

SSH_OPTS=(
  -o "ConnectTimeout=30"
  -o "StrictHostKeyChecking=no"
  -o "UserKnownHostsFile=/dev/null"
  -o "GlobalKnownHostsFile=/dev/null"
  -o "IdentitiesOnly=yes"
  -o "IdentityFile=${sshPrivateKey}"
)

scp "${SSH_OPTS[@]}" -r "root@$REMOTE_HOST:/etc/nixos/*" "$LOCAL_PATH"
exit $?
