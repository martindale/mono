# Your script's name, for help output
SCRIPT_NAME="tf-get"

# Display help
print_help() {
  echo "Usage: $SCRIPT_NAME <command> [options]"
  echo
  echo "Commands:"
  echo "  private-key      Pull and display the private key from Terraform state."
  echo "  public-key       Pull and display the public key from Terraform state."
  echo "  help             Display this help message."
  echo
  echo "Examples:"
  echo "  $SCRIPT_NAME private-key"
  echo "  $SCRIPT_NAME public-key"
}

# Check if jq and terraform commands are available
if ! command -v jq &>/dev/null || ! command -v terraform &>/dev/null; then
  echo "Error: Both jq and terraform commands must be available."
  exit 1
fi

# Use getopt to parse arguments
ARGS=$(getopt -o h --long help -n "$SCRIPT_NAME" -- "$@")
if [ $? != 0 ]; then
  exit 1
fi
eval set -- "$ARGS"

# Parse options
while true; do
  case "$1" in
  -h | --help)
    print_help
    exit 0
    ;;
  --)
    shift
    break
    ;;
  esac
done

# Check for command argument
if [ $# -eq 0 ]; then
  echo "Error: No command provided."
  print_help
  exit 1
fi

# Execute the specified command
case "$1" in
private-key)
  terraform state pull | jq -r '.resources[] | select(.name == "deploy") | .instances[0].attributes.private_key_pem'
  ;;
public-key)
  terraform state pull | jq -r '.resources[] | select(.name == "deploy") | .instances[0].attributes.public_key_openssh'
  ;;
help)
  print_help
  ;;
*)
  echo "Error: Unknown command '$1'"
  print_help
  exit 1
  ;;
esac
