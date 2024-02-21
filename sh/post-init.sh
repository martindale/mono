############################################################################
# Functions/Helpers
############################################################################

__run_as_user() {
  local user=$1
  local service=$2
  shift 2

  case "$service" in
  bitcoind)
    cli=bitcoin-cli
    cli_args=(-conf="$PLAYNET_ROOT/$service.$user.conf")
    cli_args+=(-datadir="$PLAYNET_ROOT/state/$user/$service")
    ;;

  geth)
    cli=geth
    cli_args=(--dev)
    cli_args+=(--config="$PLAYNET_ROOT/$service.$user.toml")
    cli_args+=(--datadir="$PLAYNET_ROOT/state/$user/$service/data")
    ;;

  lnd)
    cli=lncli
    cli_args=(--network regtest)
    cli_args+=(--rpcserver=$(grep '^rpclisten=' "$PLAYNET_ROOT/$service.$user.conf" | cut -d'=' -f2))
    cli_args+=(--lnddir="$PLAYNET_ROOT/state/$user/$service")
    ;;

  *)
    echo "Usage: $user {bitcoind|geth|lnd} <command>"
    return 1
    ;;
  esac

  $cli "${cli_args[@]}" "$@"
}

__gethAccount() {
  local user=$1
  local password_file=$(mktemp)
  echo -n "$user" >$password_file

  local output=$(__run_as_user portal geth account new --keystore $PLAYNET_ROOT/state/$user/geth --password $password_file 2>/dev/null)
  local keystore_file=$(echo "$output" | grep 'Path of the secret key file:' | cut -d' ' -f7)
  mv $keystore_file $PLAYNET_ROOT/state/$user/geth/keystore.json
  rm -f $password_file

  echo "$PLAYNET_ROOT/state/$user/geth/keystore.json"
}

initialize_dev_environment() {
  echo "- creating a new geth wallet for alice..."
  ALICE_GETH_KEYSTORE=$(__gethAccount alice)
  ALICE_GETH_ADDRESS="0x$(jq -r '.address' $ALICE_GETH_KEYSTORE)"
  echo "- funding new geth wallet for alice with 100 ether..."
  __run_as_user portal geth attach --exec "eth.sendTransaction({ from: eth.coinbase, to: '$ALICE_GETH_ADDRESS', value:web3.toWei(100,'ether') })" >/dev/null

  echo "- creating a new geth wallet for bob..."
  BOB_GETH_KEYSTORE=$(__gethAccount bob)
  BOB_GETH_ADDRESS="0x$(jq -r '.address' $BOB_GETH_KEYSTORE)"
  echo "- funding new geth wallet for bob with 100 ether..."
  __run_as_user portal geth attach --exec "eth.sendTransaction({ from: eth.coinbase, to: '$BOB_GETH_ADDRESS', value:web3.toWei(100,'ether') })" >/dev/null

  echo "- creating a new bitcoin wallet..."
  __run_as_user portal bitcoind createwallet 'default' >/dev/null

  echo "- generating $BITCOIND_BLOCKS blocks..."
  __run_as_user portal bitcoind -generate $BITCOIND_BLOCKS >/dev/null

  echo "- creating a new LND wallet for alice..."
  ALICE_LND_NODEID=$(__run_as_user alice lnd getinfo | jq -r .identity_pubkey)
  ALICE_LND_WALLET=$(__run_as_user alice lnd newaddress p2wkh | jq -r .address)

  echo "- creating a new LND wallet for bob..."
  BOB_LND_NODEID=$(__run_as_user bob lnd getinfo | jq -r .identity_pubkey)
  BOB_LND_WALLET=$(__run_as_user bob lnd newaddress p2wkh | jq -r .address)

  echo "- funding new LND wallet for alice..."
  __run_as_user portal bitcoind sendtoaddress $ALICE_LND_WALLET $LND_WALLET_FUNDS >/dev/null
  while [ $(__run_as_user alice lnd walletbalance | jq -r '.confirmed_balance') -eq 0 ]; do
    __run_as_user portal bitcoind -generate 1 >/dev/null
    sleep 1
  done

  echo "- funding new LND wallet for bob..."
  __run_as_user portal bitcoind sendtoaddress $BOB_LND_WALLET $LND_WALLET_FUNDS >/dev/null
  while [ $(__run_as_user bob lnd walletbalance | jq -r '.confirmed_balance') -eq 0 ]; do
    __run_as_user portal bitcoind -generate 1 >/dev/null
    sleep 1
  done

  # Open a payment channel from alice to bob and mine blocks to facilitate opening
  echo "- opening payment channel from alice to bob with $LND_CHANNEL_FUNDS sats..."
  BOB_LND_PEER_URL=$(grep '^listen=' "$PLAYNET_ROOT/lnd.bob.conf" | cut -d'=' -f2)
  __run_as_user alice lnd openchannel --local_amt=$LND_CHANNEL_FUNDS --connect=$BOB_LND_PEER_URL --node_key=$BOB_LND_NODEID >/dev/null
  while [ $(__run_as_user alice lnd pendingchannels | jq '.pending_open_channels | length') -ne 0 ]; do
    __run_as_user portal bitcoind -generate 1 >/dev/null
    sleep 1
  done

  # Open a payment channel from bob to alice and mine blocks to facilitate opening
  echo "- opening payment channel from bob to alice with $LND_CHANNEL_FUNDS sats..."
  ALICE_LND_PEER_URL=$(grep '^listen=' "$PLAYNET_ROOT/lnd.alice.conf" | cut -d'=' -f2)
  __run_as_user bob lnd openchannel --local_amt=$LND_CHANNEL_FUNDS --connect=$ALICE_LND_PEER_URL --node_key=$ALICE_LND_NODEID >/dev/null
  while [ $(__run_as_user bob lnd pendingchannels | jq '.pending_open_channels | length') -ne 0 ]; do
    __run_as_user portal bitcoind -generate 1 >/dev/null
    sleep 1
  done

  # Create the `reset` file to prevent the wallets from being recreated.
  touch $PLAYNET_ROOT/.delete_to_reset
  echo "reset complete"
}

############################################################################
# Aliases
############################################################################
alias alice='__run_as_user alice'
alias bob='__run_as_user bob'
alias portal='__run_as_user portal'

############################################################################
# Execution Flow
############################################################################

# Fail the script if any command fails
set -eu

readonly RESET_STATE=$([[ -f $PLAYNET_ROOT/.delete_to_reset ]] && echo false || echo true)
readonly LND_WALLET_FUNDS=10       # in btc
readonly LND_CHANNEL_FUNDS=1000000 # in satoshis
readonly BITCOIND_BLOCKS=$((100 + ((LND_WALLET_FUNDS * 2 + 49) / 50)))

if [[ $RESET_STATE == "true" ]]; then
  initialize_dev_environment
else
  echo "Loading portal bitcoind wallets..."
  __run_as_user portal bitcoind loadwallet 'default' >/dev/null
  __run_as_user portal bitcoind -generate 1 >/dev/null
fi

set +eu
