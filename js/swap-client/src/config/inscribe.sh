#!/bin/bash

# Set temporary variables
ORD_CMD="/home/dev/bin/ord"
BCLI_CMD="/snap/bin/bitcoin-core.cli"
BITCOIN_DATA_DIR="/home/dev/snap/bitcoin-core/common/.bitcoin"
COOKIE_FILE="/home/dev/snap/bitcoin-core/common/.bitcoin/.cookie"
RPC_URL="127.0.0.1:20332/wallet/alice"
WALLET_NAME="alice"

# Create function for the ord command
ord_command() {
  $ORD_CMD --bitcoin-data-dir $BITCOIN_DATA_DIR --cookie-file $COOKIE_FILE --rpc-url $RPC_URL -r --wallet $WALLET_NAME "$@"
}

# Create function for the bcli command
bcli_command() {
  $BCLI_CMD -datadir=$BITCOIN_DATA_DIR -rpcwallet=$WALLET_NAME "$@"
}

# Check if we need to skip the ord wallet inscribe command
SKIP_ORD=${1:-0}

# Directory containing the files
dir="./inscriptions"

if [ $SKIP_ORD -eq 0 ]; then
  # Iterate over each file in the directory
  for file in "$dir"/*; do
    if [ -f "$file" ]; then
      # Run the command for this file
      ord_command wallet inscribe --fee-rate 154 "$file"

      # Run the bcli command
      bcli_command -generate 1
    fi
  done
fi

# Run the final command after all file commands have completed
ord_command wallet inscriptions >inscriptions.json
