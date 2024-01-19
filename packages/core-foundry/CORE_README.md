# Core Contracts Guide 

## Overview 

This document contains information about scripts that helps with the deployment, initialization and interaction with
Core Contracts for Human Protocol. 

## Upgrading Contract Using Proxies  
-Create an .env file based on .env.example 
- Fill out these variables (**HMT_ADDRESS, STAKING_PROXY, ESCROW_FACTORY_PROXY, REWARD_POOL_PROXY**) with their respective values. 
- Then, run : ```forge script script/UpgradeProxies.s.sol:UpgradeProxiesScript --rpc-url $NETWORK --broadcast --verify --legacy```
- Make sure the PRIVATE_KEY of the address who deployed the proxies is the one running this command. 

## Testing Contracts 

To test contracts using Foundry run : 

- ```forge test --match-path ./test/<FILE_NAME>``` to run all tests for a specific file. 
- ```forge test --match-path ./test/<FILE_NALE> --match-test "<TEST_NAME"``` to run a specific test for a specific file. 
