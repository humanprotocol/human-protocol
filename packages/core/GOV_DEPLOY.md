# Deployment Guide

## Overview

This document contains information about scripts that helps with the deployment, initialization and interaction with
MetaHuman Governance smart contracts.

## Preparation

To make the scripts work please create `.env` file based on `.env.example` and fill the `User data` section.
Variables `SECOND_PRIVATE_KEY` and `THIRD_PRIVATE_KEY` are not required to deploy the contracts, they are used for
testing purposes to make sure that there are token holders that will be eligible to vote.

After creating `.env` file please run:

```
source .env
```

## Deploying the contracts

The deployment process consist of deploying:

- HMToken - this is used as a "main" token in the ecosystem.
- VHMToken - a `ERC20Wrapper` on the "main" token with `ERC20Votes` extension.
- TimelockController - An OpenZeppelin's implementation of a timelocked controller that is used to execute successful
  proposals.
- MetaHumanGovernor - The hub contract that enables proposal creation and voting. It is the main contract in the whole
  ecosystem.
- DAOSpokeContract (a separate `HMToken` and `VHMToken` will be deployed, as the contract can be deployed on other
  chains) -
  The spoke contract that enables to vote on proposal on other chains.

### Base(HMT) token deployment

To deploy the base token contract please run following command:

```
forge script script/HMTDeployment.s.sol:HMTDeployment --rpc-url $<HUB/SPOKE>_RPC_URL --broadcast --verify
```

After successfully running the script please fill `.env` with address of deployed base token to variable `HM_TOKEN_ADDRESS`.

### Vote token deployment

Before deploying the vote token please set the environment variable `HM_TOKEN_ADDRESS` to correct value for given chain.

To deploy the vote token contract please run following command:

```
forge script script/VHMTDeployment.s.sol:VHMTDeployment --rpc-url $<HUB/SPOKE>_RPC_URL --broadcast --verify
```

After successfully running the script please fill `.env` with address of deployed vote token. Depending on if it will be
used to deploy Hub or Spoke please fill `HUB_VOTE_TOKEN_ADDRESS` or `SPOKE_VOTE_TOKEN_ADDRESS`.

### Hub contract deployment

To deploy the Hub contract please run following command:

```
forge script script/HubDeployment.s.sol:HubDeployment --rpc-url $HUB_RPC_URL --broadcast --verify
```

This will
deploy  [MetaHumanGovernor.sol](src%2FMetaHumanGovernor.sol) and `TimelockController`,
then grant `PROPOSER_ROLE` on
Timelock to Governance and then remove `TIMELOCK_ADMIN_ROLE` from the deployer.

After successfully running the script please fill `.env` with addresses of:

- GOVERNOR_ADDRESS
- TIMELOCK_ADDRESS

The addresses can be found in console output of the script and in
the `/broadcast/HubDeployment.s.sol/<chain_id>/run-latest.json`

### Spoke contract deployment

This will
deploy [DAOSpokeContract.sol](src%2FDAOSpokeContract.sol)
on chain provided by the `--rpc-url` variable. In testing, the contract was deployed on Polygon Mumbai.

```
forge script script/SpokeDeployment.s.sol:SpokeDeployment --rpc-url $SPOKE_RPC_URL --etherscan-api-key $SPOKE_ETHERSCAN_API_KEY --broadcast --legacy --verify
```

After successfully running the script please fill add the deployed contract chain id and address to these lists (comma
separated addresses):

- SPOKE_ADDRESSES
- SPOKE_CHAIN_IDS

The addresses can be found in console output of the script and in
the `/broadcast/SpokeDeployment.s.sol/<chain_id>/run-latest.json`.

Chain id can be found in the [Wormhole documentation](https://docs.wormhole.com/wormhole/blockchain-environments/contracts). The value should be copied from `Wormhole Chain I` column.

### Setting spoke contracts in the hub

Next step is to let the Hub know about Spoke addresses and chains. To update the Hub with `SPOKE_ADDRESSES`
and `SPOKE_CHAIN_IDS` please run
following script:

```
forge script script/HubUpdateSpokeContracts.s.sol:HubUpdateSpokeContracts --rpc-url $HUB_RPC_URL --broadcast
```

### Transfer governance ownership to timelock

Last(optional) step of infrastructure setup is to transfer the ownership to the timelock contract, which effectively means that every change to the contract would need to be approved by the DAO.

To transfer the ownership please make sure that all the initial setup is finished and fill in the `TIMELOCK_ADDRESS` environment variable.

Then run the following script:

```
forge script script/HubTransferOwnership.s.sol:HubTransferOwnership --rpc-url $HUB_RPC_URL --broadcast
```


## Deploying with Github Actions

Fill [json](sample-spoke-params.json) with desired variables for spoke contract deployments, copy its content into field described 'Json with parameters for spoke deploy', provide `HM_TOKEN_ADDRESS` variable value and provide other parameters if needed, e.g. if you want transfer governance ownership to timelock check this field.

## Interacting with Governance ecosystem

After setting up the ecosystem, everything is ready for user interaction.

### Self-delegate voting power

First step is to self-delegate the voting power that is the amount of [VHMToken.sol](src%2Fvhm-token%2FVHMToken.sol)
held by given account.

The voting tokens are different on each chain, for now there are two scripts created to delegate on Hub or Spoke chain.

```
forge script script/HubSelfDelegateVote.s.sol:HubSelfDelegateVote --rpc-url $HUB_RPC_URL --broadcast
```

```
forge script script/SpokeSelfDelegateVote.s.sol:SpokeSelfDelegateVote --rpc-url $SPOKE_RPC_URL --broadcast --legacy
```

### Creating proposal

Create proposal script is used to create the proposal on Hub contract using `crossChainPropose` function.

This should be used for testing purposes as the proposal action is hardcoded to be a simple grant.

To create a different proposal just change the `targets`, `values`, `calldatas` and `description` in
the [DeploymentUtils.sol](script%2FDeploymentUtils.sol) file in function `getProposalExecutionData()`.

```
forge script script/CreateProposal.s.sol:CreateProposal --rpc-url $HUB_RPC_URL --broadcast
```

### Cast vote

There are two scripts to cast a `for` vote on proposal defined in
the [DeploymentUtils.sol](script%2FDeploymentUtils.sol) file in function `getProposalExecutionData()`.

`CastVote` using the Hub contract:

```
forge script script/CastVote.s.sol:CastVote --rpc-url $HUB_RPC_URL --broadcast
```

`CastVoteThroughSpokeContract` using the Spoke contract:

```
forge script script/CastVoteThroughSpokeContract.s.sol:CastVoteThroughSpokeContract --rpc-url $SPOKE_RPC_URL --broadcast --legacy
```

### Request collections

After the voting period ends, Hub contract needs to `RequestCollections` from Spoke contracts. To call this function
please execute:

```
forge script script/RequestCollections.s.sol:RequestCollections --rpc-url $HUB_RPC_URL --broadcast
```

### Queue

After collection phase has ended anyone can `Queue` the proposal for execution by calling `queue` function on Hub
contract. This can be done using:

```
forge script script/QueueProposal.s.sol:QueueProposal --rpc-url $HUB_RPC_URL --broadcast
```

### Execute

After timelock period has passed anyone can `Execute` the proposal for execution by calling `execute` function on Hub
contract. This can be done using:

```
forge script script/ExecuteProposal.s.sol:ExecuteProposal --rpc-url $HUB_RPC_URL --broadcast
```

## Helper scripts

There are also two helper scripts that help with the development and testing.

- [FundAccounts.s.sol](script%2FFundAccounts.s.sol) can be used to fund account
  with [HMToken.sol](src%2Fhm-token%2FHMToken.sol). Account address is taken from .env variable `ADDRESS_TO_FUND`.

```
forge script script/FundAccounts.s.sol:FundAccounts --rpc-url $HUB_RPC_URL --broadcast
```

- [TransferTokensToTimelock.s.sol](script%2FTransferTokensToTimelock.s.sol) can be used to transfer tokens to timelock
  when trying to execute a grant proposal.

```
forge script script/TransferTokensToTimelock.s.sol:TransferTokensToTimelock --rpc-url $HUB_RPC_URL --broadcast
```

