#!/bin/sh

PORT="${PORT:-8545}"
RPC_URL="http://localhost:$PORT"

liveness() {
  echo "Waiting for $RPC_URL to respond with its version"
  while true
  do
    RESPONSE_BODY=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}')
    RPC_VERSION=$(echo "$RESPONSE_BODY" | grep -o '"result":"[^"]*"' | awk -F'"' '{print $4}')

    if [ -n "$RPC_VERSION" ]; then
      echo "RPC is live: $RPC_VERSION"
      break
    fi

    echo "Waiting..."
    sleep 2
  done
}

# Using a magic nubmer of 23 here because this is a block number when local node is ready to use
READINESS_BLOCK_NUMBER=23

readiness() {
  echo "Waiting for $RPC_URL to reach the desired block #$READINESS_BLOCK_NUMBER"
  while true
  do
    RESPONSE_BODY=$(curl -s -X POST "$RPC_URL" -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
    BLOCK_NUMBER_HEX=$(echo "$RESPONSE_BODY" | grep -o '"result":"[^"]*"' | awk -F'"' '{print $4}')
    BLOCK_NUMBER=$((BLOCK_NUMBER_HEX))

    if [ "$BLOCK_NUMBER" -ge $READINESS_BLOCK_NUMBER ]; then
      echo "RPC is ready"
      break
    fi

    echo "Waiting..."
    sleep 2
  done
}

# Call the function passed as the first argument
"$@"
