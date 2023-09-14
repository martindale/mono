# Fail the script if any command fails
set -eu

readonly RESET_STATE=$([[ -f $PLAYNET_ROOT/.delete_to_reset ]] && echo false || echo true)

# Reset environment if required
if [[ $RESET_STATE == "true" ]]; then
  echo "resetting developer environment..."
  rm -rf $PLAYNET_ROOT/{log,state}/*
fi

# Ensure important directories are there
echo "Ensuring PLAYNET log and state directores exists..."
mkdir -p $PLAYNET_ROOT/log/{alice,bob,portal}
mkdir -p $PLAYNET_ROOT/state/{alice,bob,portal}/{bitcoind,geth,lnd}
