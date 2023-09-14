#!/bin/bash

# Function to run when the script receives a SIGINT
exit_script() {
  echo "Script interrupted. Exiting..."
  exit 1
}

# Run the exit_script function if this script receives a SIGINT
trap exit_script SIGINT

# Loop indefinitely
while true; do
  # Run the two commands
  ./inscribe.sh 1
  ./updateInscriptions.sh ./inscriptions.json inscription_info.js

  # Wait for 5 seconds
  sleep 5
done
