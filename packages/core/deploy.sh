#!/bin/bash

set -e

export HM_TOKEN_ADDRESS=$HUB_HM_TOKEN_ADDRESS
echo "Vote token deployment"
forge script script/VHMTDeployment.s.sol:VHMTDeployment --rpc-url $HUB_RPC_URL --etherscan-api-key "$HUB_ETHERSCAN_API_KEY" --broadcast --verify
export HUB_VOTE_TOKEN_ADDRESS="$(cat "broadcast/VHMTDeployment.s.sol/$HUB_CHAIN_ID/run-latest.json" | jq -r '.transactions[0].contractAddress')"

# hub contract deployment
echo "Deploying Hub contract"
forge script script/HubDeployment.s.sol:HubDeployment --rpc-url $HUB_RPC_URL --etherscan-api-key $HUB_ETHERSCAN_API_KEY --broadcast --verify
export TIMELOCK_ADDRESS="$(cat "broadcast/HubDeployment.s.sol/$HUB_CHAIN_ID/run-latest.json" | jq -r '.transactions[0].contractAddress')"
export GOVERNOR_ADDRESS="$(cat "broadcast/HubDeployment.s.sol/$HUB_CHAIN_ID/run-latest.json" | jq -r '.transactions[1].contractAddress')"

# spoke contract deployment
echo "Deploy Spoke contracts"
COUNT=$(echo "$SPOKE_PARAMS" | jq -s '. | length')
DEPLOYED_SPOKES=""
for ((i=0; i <= $COUNT; i++)); do
  # set vars
  export SPOKE_AUTOMATIC_RELAYER_ADDRESS=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_AUTOMATIC_RELAYER_ADDRESS')
  export SPOKE_WORMHOLE_CHAIN_ID=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_WORMHOLE_CHAIN_ID')
  export SPOKE_CHAIN_ID=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_CHAIN_ID')
  export SPOKE_RPC_URL=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_RPC_URL')
  export SPOKE_ETHERSCAN_API_KEY=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_ETHERSCAN_API_KEY')
  export SPOKE_HM_TOKEN_ADDRESS=$(echo "$SPOKE_PARAMS" | jq -r --argjson i "$i" '.[$i].SPOKE_HM_TOKEN_ADDRESS')

  export HM_TOKEN_ADDRESS=$SPOKE_HM_TOKEN_ADDRESS
  forge script script/VHMTDeployment.s.sol:VHMTDeployment --rpc-url $SPOKE_RPC_URL --etherscan-api-key $SPOKE_ETHERSCAN_API_KEY --broadcast --verify --gas-estimate-multiplier 200
  export SPOKE_VOTE_TOKEN_ADDRESS="$(cat "broadcast/VHMTDeployment.s.sol/$SPOKE_CHAIN_ID/run-latest.json" | jq -r '.transactions[0].contractAddress')"

  forge script script/SpokeDeployment.s.sol:SpokeDeployment --rpc-url $SPOKE_RPC_URL --etherscan-api-key $SPOKE_ETHERSCAN_API_KEY --broadcast --verify --gas-estimate-multiplier 200
  export SPOKE_ADDRESS="$(cat "broadcast/SpokeDeployment.s.sol/$SPOKE_CHAIN_ID/run-latest.json" | jq -r '.transactions[0].contractAddress')"
  export SPOKE_WORMHOLE_CHAIN_IDS="${SPOKE_WORMHOLE_CHAIN_IDS},${SPOKE_WORMHOLE_CHAIN_ID}"
  export SPOKE_ADDRESSES="${SPOKE_ADDRESSES},${SPOKE_ADDRESS}"
  DEPLOYED_SPOKES="${DEPLOYED_SPOKES}Spoke $i address: $SPOKE_ADDRESS\nSpoke $i wormholeChainId: $SPOKE_WORMHOLE_CHAIN_ID\n\n"
done
# remove first character
export SPOKE_WORMHOLE_CHAIN_IDS=${SPOKE_WORMHOLE_CHAIN_IDS:1}
export SPOKE_ADDRESSES=${SPOKE_ADDRESSES:1}

echo "Setting spoke contracts in the hub"
forge script script/HubUpdateSpokeContracts.s.sol:HubUpdateSpokeContracts --rpc-url $HUB_RPC_URL --broadcast

if [[ $TIMELOCK = "true" ]]; then
  echo "Transfer governance ownership to timelock"
  forge script script/HubTransferOwnership.s.sol:HubTransferOwnership --rpc-url $HUB_RPC_URL --broadcast
fi

echo "Hub contract address: $GOVERNOR_ADDRESS"
echo "Hub contract wormholeChainId: $HUB_WORMHOLE_CHAIN_ID"
echo -e "$DEPLOYED_SPOKES"
