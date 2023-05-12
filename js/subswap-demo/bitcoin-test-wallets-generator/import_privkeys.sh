#!/usr/bin/env bash

# Usage: die [exit_code] [error message]
die() {
  local code=$? now=$(date +%T.%N)
  if [ "$1" -ge 0 ] 2>/dev/null; then  # assume $1 is an error code if numeric
    code="$1"
    shift
  fi
  echo "$0: ERROR at ${now%???}${1:+: $*}" >&2
  exit $code
}

help() {
  echo "Syntax: import_privkeys.sh [-h|-d <datadir>]"
  echo "options:"
  echo "-h   Print this help"
  echo "-d   Specify the bitcoin data directory, and make sure it contains a bitcoin.conf file"
  echo
}
datadir="."
while getopts ":hd:" option; do
  case $option in
    h) help
       exit;;
    d) datadir=$OPTARG;;
   \?) echo "Invalid option"
       exit;;
  esac
done

echo $datadir

count=0
wallets=(alice_1 alice_2 alice_3 bob_1 bob_2 bob_3 carol_1 carol_2 carol_3 dave_1 dave_2 dave_3 eve_1 eve_2 eve_3 mallory_1 mallory_2 mallory_3)

# Check if it exists as a node module or not
walletsPath=$(cat ../../wallets.json | grep -q 'alice' && echo "../../wallets.json" || echo "./wallets.json")

# Returns all wif without null values
cat ${walletsPath} | jq -r '.[][] | (.wif // empty)' |
# Iterate
while read -r wif
do
    wallet=${wallets[count]}
    echo ${wallet}
    descriptor1="pk(${wif})"
    descriptor2="pkh(${wif})"
    descriptor3="wpkh(${wif})"
    descriptor4="sh(wpkh(${wif}))"

    checksum1=$(bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" getdescriptorinfo "${descriptor1}" | jq -r '.checksum')
    checksum2=$(bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" getdescriptorinfo "${descriptor2}" | jq -r '.checksum')
    checksum3=$(bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" getdescriptorinfo "${descriptor3}" | jq -r '.checksum')
    checksum4=$(bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" getdescriptorinfo "${descriptor4}" | jq -r '.checksum')

    command0="bitcoin-cli -datadir="${datadir}" createwallet "${wallet}" || die"

    command1="bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" importdescriptors '[{\"desc\": \""${descriptor1}\#${checksum1}"\", \"timestamp\":\"now\"}]' || die"
    command2="bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" importdescriptors '[{\"desc\": \""${descriptor2}\#${checksum2}"\", \"timestamp\":\"now\"}]' || die"
    command3="bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" importdescriptors '[{\"desc\": \""${descriptor3}\#${checksum3}"\", \"timestamp\":\"now\"}]' || die"
    command4="bitcoin-cli -datadir="${datadir}"  -rpcwallet="${wallet}" importdescriptors '[{\"desc\": \""${descriptor4}\#${checksum4}"\", \"timestamp\":\"now\"}]' || die"
    eval $command1
    eval $command2
    eval $command3
    eval $command4

    command5="bitcoin-cli  -datadir="${datadir}" -rpcwallet="${wallet}" -generate 101  || die"
    eval $command5

    command6="bitcoin-cli -datadir="${datadir}" getdescriptorinfo \""${descriptor1}"\""
    command7="bitcoin-cli -datadir="${datadir}" getdescriptorinfo \""${descriptor2}"\""
    command8="bitcoin-cli -datadir="${datadir}" getdescriptorinfo \""${descriptor3}"\""
    command9="bitcoin-cli -datadir="${datadir}" getdescriptorinfo \""${descriptor4}"\""
#    eval $command6
#    eval $command7
#    eval $command8
#    eval $command9

    command10="bitcoin-cli -datadir="${datadir}" -rpcwallet="${wallet}" listdescriptors"
#    eval $command10

    ((count ++))s
done
