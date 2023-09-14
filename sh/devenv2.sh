### Configurable Parameters ###
PID_FILE="${DEVENV_PID_FILE:-/tmp/devenv_process-compose.pid}"
PORT="${DEVENV_PORT:-8585}"
MAX_RETRIES="${DEVENV_MAX_RETRIES:-120}"

### Initial Checks ###

# Check for dependencies
for cmd in jq curl process-compose lsof; do
  if ! command -v $cmd &>/dev/null; then
    log_error "$cmd is not installed."
    exit 1
  fi
done

# Check for PORTAL_ROOT
if [ -z "$PORTAL_ROOT" ] || [ ! -d "$PORTAL_ROOT" ]; then
  log_error "PORTAL_ROOT is not set or is not a valid directory."
  exit 1
fi

### Helper Functions ###

log_info() {
  echo "[devenv] [INFO] $1"
}

log_error() {
  echo "[devenv] [ERROR] $1" >&2
}

check_port_availability() {
  if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
    log_error "Port $PORT is already in use. Aborting."
    exit 1
  else
    log_info "Port $PORT is available."
  fi
}

### Main Functions ###

devenv_up() {
  local watch_mode=$1

  # Check if already running using PID file
  if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
    log_error "Development environment is already running (PID file check). Use 'down' before starting again."
    exit 1
  fi

  # Check using pgrep for process name
  if pgrep -x "process-compose" >/dev/null; then
    log_error "Development environment is already running (process name check). Use 'down' before starting again."
    exit 1
  fi

  # Check port availability
  check_port_availability

  log_info "Starting development environment..."
  nohup process-compose --port=$PORT --tui=false --config $PORTAL_ROOT/sh/process-compose.yaml up >/dev/null 2>&1 &
  echo $! >$PID_FILE
  log_info "Started process-compose with PID $!"

  # Check for CI mode and then poll the status
  if [ "$watch_mode" == "--watch" ]; then
    local retries=0
    while true; do
      devenv_status
      exit_code=$?
      if [ $exit_code -eq 0 ]; then
        log_info "Development environment is ready."
        break
      else
        retries=$((retries + 1))
        if [ $retries -ge $MAX_RETRIES ]; then
          log_error "Max retries reached. Development environment might not be ready."
          exit 1
        fi
        log_info "Waiting for development environment to be ready... Retry $retries/$MAX_RETRIES"
        sleep 1
      fi
    done
  fi
}

devenv_down() {
  log_info "Shutting down development environment..."

  if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    # Check if the PID belongs to process-compose
    if ps -p $PID | grep -q "process-compose"; then
      if kill -TERM $PID; then
        log_info "Development environment shut down successfully."
      else
        log_error "Failed to shut down development environment."
      fi
      rm $PID_FILE
    else
      log_error "PID does not belong to process-compose. Manual intervention might be required."
    fi
  else
    log_info "No running development environment found."
  fi
}

devenv_attach() {
  if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
    process-compose --port=$PORT attach
  else
    log_error "Development environment is not running. Cannot attach."
  fi
}

devenv_status() {
  # Attempt to retrieve the status of the "post-init" process
  RESULT=$(curl -s --fail http://localhost:$PORT/processes 2>/dev/null)

  if [ $? -ne 0 ]; then
    log_error "devenv not running or port might be closed."
    return 1
  fi

  # Parse the status using jq
  STATUS=$(echo "$RESULT" | jq -r '.data[] | select(.name == "post-init").status')

  if [ "$STATUS" == "Completed" ]; then
    log_info "Status: OK"
    return 0
  elif [ -z "$STATUS" ]; then
    log_error "'post-init' process status not found."
    return 3
  else
    log_error "Status: KO"
    return 2
  fi
}

devenv_help() {
  echo "devenv: Development Environment Control Script"
  echo
  echo "Usage: devenv <command> [options]"
  echo
  echo "Commands:"
  echo "  up       Start the development environment. Use '--watch' option to continuously check its status."
  echo "  down     Shut down the development environment."
  echo "  stop     Alias for 'down'."
  echo "  attach   Attach to the running development environment."
  echo "  status   Check the status of the 'post-init' process."
  echo "  help     Display this help message."
  echo
  echo "Options:"
  echo "  --watch    (For 'up' command) Continuously check the status until the service is ready or max retries are reached."
  echo
  echo "Examples:"
  echo "  devenv up           Start the development environment."
  echo "  devenv up --watch   Start and continuously check its status."
  echo "  devenv stop         Shut down the development environment."
  echo
}

### Signal Handling ###

# Handle termination signals
trap "devenv_down; exit" SIGINT SIGTERM

# Check for at least one argument
if [ "$#" -lt 1 ]; then
  log_error "No command provided."
  devenv_help
  exit 1
fi

### Main Script ###

# Handle the command
case "$1" in
up)
  # Check for the --watch flag in the second argument
  if [ "$2" == "--watch" ]; then
    devenv_up "--watch"
  else
    devenv_up
  fi
  ;;
down | stop)
  devenv_down
  ;;
attach)
  devenv_attach
  ;;
status)
  devenv_status
  ;;
help)
  devenv_help
  ;;
*)
  log_error "Unknown command '$1'"
  devenv_help
  exit 1
  ;;
esac
