#!/bin/bash

inputFile=$1
outputFile=$2

# Obtain length of the input array
len=$(jq 'length' $inputFile)

# Calculate start index for slicing the last 8 items
start_index=$((len > 8 ? len - 8 : 0))

# Process the data
output=$(jq -c "[.[$start_index:][] | {title: (\"Inscription #\" + (\".\") + tostring), type: \"BTCORD-\", network: \"btc.btc\", detail: \"Inscription\", rate: 1, isNFT: true, img_url: (\"http://localhost/content/\" + .inscription), balance: 1, options: [{type: \"paddingAmount\", title: \"Padding Amount\", value: 4000}], info: {inscription: .inscription, location: .location, explorer: .explorer}}]" $inputFile | jq -M '.')

# Generate unique title and type for each item based on its position
output=$(echo "$output" | jq '[foreach .[] as $item (0; .+1; . as $i | $item | .title = "Inscription #\($i+1)" | .type += "\($i+1)")]')

echo "export const INSCRIPTIONS = $output" >$outputFile
