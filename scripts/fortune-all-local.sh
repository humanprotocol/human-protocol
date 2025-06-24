#!/bin/sh
set +x

check_core_folders() {
  SCRIPT_PATH="$0"
  PROJECT_ROOT=$(cd "$(dirname "$SCRIPT_PATH")" && cd .. && pwd)
  CORE_DIR="$PROJECT_ROOT/packages/core"

  if [ ! -d "$CORE_DIR/abis/legacy" ] || [ ! -d "$CORE_DIR/typechain-types" ]; then
    echo "Libs are not built, building..."
		yarn workspace human-protocol build:libs;
	fi
}

deploy_subgraph() {
  echo "Waiting for graph node to be healthy..."
  retries=0
  while ! yarn workspace @human-protocol/subgraph health-local:node
  do
    ((retries++))
    if [ "$retries" -ge 10 ]; then
      exit 1
    fi
		sleep 2;
	done;

  echo "Deploying subgraph..."

  NETWORK=localhost yarn workspace @human-protocol/subgraph generate
  yarn workspace @human-protocol/subgraph create-local
  yarn workspace @human-protocol/subgraph deploy-local
}

setup_oracles() {
  echo "Setting up oracles..."
  # It's important to run these commands sequentially
  # to successfully execute all parallel blockchain transactions
  # that might conflict on same nonce value
  echo "Setup JL" && yarn workspace @human-protocol/job-launcher-server setup:local
  echo "Setup RepO" && yarn workspace @human-protocol/reputation-oracle setup:local
  echo "Setup ExcO" && yarn workspace @human-protocol/fortune-exchange-oracle-server setup:local
  echo "Setup RecO" && yarn workspace @human-protocol/fortune-recording-oracle setup:local

  echo "Oracles successfully set up"
}

run_jl_server() {
  NODE_ENV=local yarn workspace @human-protocol/job-launcher-server migration:run
  NODE_ENV=local yarn workspace @human-protocol/job-launcher-server start:dev
}

run_jl_client() {
  NODE_ENV=local yarn workspace @human-protocol/job-launcher-client start
}

run_reputation_oracle() {
	NODE_ENV=local yarn workspace @human-protocol/reputation-oracle migration:run
	NODE_ENV=local yarn workspace @human-protocol/reputation-oracle start:dev
}

run_fortune_exchange_oracle() {
	NODE_ENV=local yarn workspace @human-protocol/fortune-exchange-oracle-server migration:run
	NODE_ENV=local yarn workspace @human-protocol/fortune-exchange-oracle-server start:dev
}

run_fortune_recording_oracle() {
	NODE_ENV=local yarn workspace @human-protocol/fortune-recording-oracle start:dev
}

full_run() {
  check_core_folders

  echo "Running Fortune w/ deps locally"

  # Run web3 infra
  yarn workspace human-protocol docker:web3-up

  deploy_subgraph

  # Run services infra
  yarn workspace human-protocol docker:infra-up

  setup_oracles

  # Run services
  run_jl_client &
  PID_JL_CLIENT=$!

  run_jl_server &
  PID_JL_SERVER=$!

  run_reputation_oracle &
  PID_REPO=$!

  run_fortune_exchange_oracle &
  PID_EXO=$!

  run_fortune_recording_oracle &
  PID_RECO=$!

  echo "Running..."
}

shutdown() {
  # Ignore subsequent Ctrl+C to properly shutdown
  trap '' SIGINT
  echo "\nShutting down Fortune w/ deps"

  PIDS="$PID_JL_CLIENT $PID_JL_SERVER $PID_REPO $PID_EXO $PID_RECO"
  # Graceful shutdown
  for PID in $PIDS
  do
    kill -SIGINT "$PID" 2>/dev/null
  done

  echo "Waiting for apps graceful shutdown"
  # Wait for a while
  sleep 5

  # After waiting kill any still alive
  for PID in $PIDS
  do
    if kill -0 "$PID" 2>/dev/null; then
      kill -SIGKILL "$PID"
    fi
  done

  echo "Shutting down docker deps"
  yarn workspace human-protocol docker:web3-down || true
  yarn workspace human-protocol docker:infra-down || true

  echo "Shutdown finished"
  exit 0
}

trap shutdown SIGINT ERR

full_run

# wait for Ctrl+C
wait
