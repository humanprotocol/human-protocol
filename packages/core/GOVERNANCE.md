<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">Human Protocol — Governance</h1>
<p align="center">Cross-chain governance contracts (Hub + Spokes) and tooling.</p>

## Overview

The Governance system is composed of a Hub Governor (MetaHumanGovernor) and one or more Spoke contracts (DAOSpokeContract) on other chains. Proposals are created on the Hub and broadcast via Wormhole Relayer to Spokes. Voting occurs on Hub and Spokes; results are collected back to the Hub before queueing/execution through a Timelock.

ABIs for these contracts are exported under `packages/core/abis/governance` on compile.

## Contracts

### MetaHumanGovernor (Hub)

Based on OpenZeppelin Governor with extensions:

- GovernorSettings: voting delay/period, proposal threshold (in seconds, timestamp mode)
- GovernorVotes & GovernorVotesQuorumFraction: ERC20Votes-based voting and quorum percent
- GovernorTimelockControl: queue/execute through TimelockController
- CrossChainGovernorCountingSimple: sums Hub + Spoke votes, maintains Spoke snapshots per proposal
- Magistrate: privileged role that can create cross-chain proposals and trigger certain actions

Key functions:

- `crossChainPropose(targets, values, calldatas, description)` (onlyMagistrate, payable):
  Creates a proposal on the Hub, snapshots current Spokes, and broadcasts to all Spokes via Wormhole.
- `requestCollections(proposalId)` (payable):
  After the vote period ends, requests each Spoke to send back its tallies.
- `queue(targets, values, calldatas, descriptionHash)`: Queues a successful proposal in the Timelock; requires collection phase to be finished if Spokes are involved.
- `crossChainCancel(...)` (payable): Cancels and broadcasts cancel to Spokes.
- `updateSpokeContracts(spokes)`: Owner-only (Ownable) to set active Spokes. Typically owned by Timelock.

Constructor (simplified):

`MetaHumanGovernor(IVotes token, TimelockController timelock, CrossChainAddress[] spokes, uint16 hubWormholeChainId, address wormholeRelayer, address magistrate, uint256 secondsPerBlock, uint48 votingDelaySeconds, uint32 votingPeriodSeconds, uint256 proposalThreshold, uint256 quorumFraction)`

### DAOSpokeContract (Spoke)

Receives proposal metadata from Hub and opens a local voting window based on timestamps supplied by Hub.

- `castVote(proposalId, support)`: Vote with ERC20Votes weight at the snapshot time
- `receiveWormholeMessages(...)`: Handles incoming broadcasts from Hub
- `sendVoteResultToHub(proposalId)` (onlyMagistrate, payable): Sends tallies to Hub (also triggered when Hub calls `requestCollections`)

Constructor (simplified):

`DAOSpokeContract(bytes32 hubAddress, uint16 hubChainId, IVotes voteToken, uint256 targetSecondsPerBlock, uint16 spokeChainId, address wormholeRelayer, address magistrate)`

### VHMToken (Voting token)

Wrapper token (ERC20Votes + ERC20Wrapper) for HMT used for voting. Timestamps are used for clock mode.

- Deploy with `VHMToken(HMT_ADDRESS)` and self-delegate to activate voting power.

### Magistrate

Minimal Ownable-like role with no renounce. Controls proposal creation on Hub and result sending on Spokes. Can be transferred via `transferMagistrate(newMagistrate)`.

### Wormhole Interfaces

`IWormholeRelayer` and `IWormholeReceiver` are used to send/receive cross-chain messages via Wormhole Automatic Relayer.

## Environment

Create a `.env` in `packages/core` with at least the following variables (see `.env.example` for more)

You also need the relevant explorer API keys if you plan to verify contracts.

## Build

```bash
yarn install
yarn compile
```

## Deployment

All commands are run from `packages/core` unless noted. Use `--network <name>` for the target network (see `hardhat.config.ts`).

### 1) Deploy vHMT (voting token)

Prereq: `HMT_TOKEN_ADDRESS` set and funded deployer key.

```bash
npx hardhat run scripts/deploy-vhmt.ts --network <hubNetwork>
```

### 2) Deploy Hub (Governor + Timelock)

Ensure Hub env vars are filled: `HUB_WORMHOLE_CHAIN_ID`, `HUB_AUTOMATIC_RELAYER_ADDRESS`, `MAGISTRATE_ADDRESS`, `HUB_SECONDS_PER_BLOCK`, voting params, and `HUB_VOTE_TOKEN_ADDRESS`.

```bash
yarn deploy:hub --network <hubNetwork>
```

Optionally, transfer ownership (Ownable on Governor for spoke updates) to the Timelock:

```bash
npx hardhat run scripts/dao-ownership.ts --network <hubNetwork>
```

### 3) Deploy Spokes (per Spoke chain)

For each Spoke network, set:

- `SPOKE_WORMHOLE_CHAIN_IDS` = Wormhole chainId of the Spoke
- `SPOKE_AUTOMATIC_RELAYER_ADDRESS` = Wormhole Automatic Relayer on the Spoke
- `SPOKE_VOTE_TOKEN_ADDRESS` = vHMT (or other IVotes) on the Spoke

Then deploy:

```bash
yarn deploy:spokes --network <spokeNetwork>
```

Collect all Spoke addresses and their Wormhole chain IDs for the update step.

### 4) Register Spokes on the Hub

Set `SPOKE_ADDRESSES` and `SPOKE_WORMHOLE_CHAIN_IDS` as comma-separated lists, then run on the Hub network:

```bash
yarn update:spokes --network <hubNetwork>
```

### 5) Self-delegate voting power (optional, for testing/quorum)

Provide `SECOND_PRIVATE_KEY` and `THIRD_PRIVATE_KEY` and run:

```bash
yarn hub:selfdelegate:vote --network <hubNetwork>
yarn spoke:selfdelegate:vote --network <spokeNetwork>
```

## Proposal lifecycle

1. Create (Hub): set `DESCRIPTION` and run:

   ```bash
   yarn create:proposal --network <hubNetwork>
   ```

2. Vote (Hub + Spokes):

   - On Hub, use standard OZ Governor voting flows (e.g., cast votes via a UI or script if enabled).
   - On each Spoke, call `castVote(proposalId, support)` where support = 0 (Against), 1 (For), 2 (Abstain). Window is enforced by timestamps provided by Hub.

3. Collect Spoke tallies (Hub): after the main voting period ends, call on Hub:

   - `requestCollections(proposalId)` (payable): triggers Spokes to send results back via Wormhole. This repository does not include a ready-made script; use Hardhat console or a block explorer to call it. Ensure enough ETH to cover relayer quotes.

4. Queue (Hub): once `state(proposalId)` is `Succeeded`, queue in Timelock:

   ```bash
   npx hardhat run scripts/queue-proposal.ts --network <hubNetwork>
   ```

5. Execute (Hub): after the Timelock delay, execute with `execute(targets, values, calldatas, descriptionHash)` using the same params used for queue. You can use a block explorer or a small script.

Notes:

- `propose(...)` on the Hub is intentionally disabled; use `crossChainPropose(...)`.
- The Hub will return `Pending` while waiting for Spoke collection after the voting period if collection hasn’t finished.
- Fees: cross-chain messaging uses Wormhole Relayer quotes; ensure the sender funds cover costs on create and collection.

## Verification

Verify contracts per network using Hardhat’s verify task (examples):

```bash
# Hub governor
npx hardhat verify --network <hubNetwork> <GOVERNOR_ADDRESS> \
  <HUB_VOTE_TOKEN_ADDRESS> <TIMELOCK_ADDRESS> "[]" <HUB_WORMHOLE_CHAIN_ID> \
  <HUB_AUTOMATIC_RELAYER_ADDRESS> <MAGISTRATE_ADDRESS> <HUB_SECONDS_PER_BLOCK> \
  <VOTING_DELAY> <VOTING_PERIOD> <PROPOSAL_THRESHOLD> <QUORUM_FRACTION>

# Timelock (if needed)
npx hardhat verify --network <hubNetwork> <TIMELOCK_ADDRESS> 1 [] [] <deployer>

# Spoke (use bytes32-padded governor address)
npx hardhat verify --network <spokeNetwork> <SPOKE_ADDRESS> \
  <BYTES32_GOVERNOR_ADDRESS> <HUB_WORMHOLE_CHAIN_ID> <SPOKE_VOTE_TOKEN_ADDRESS> \
  <TARGET_SECONDS_PER_BLOCK> <SPOKE_WORMHOLE_CHAIN_IDS> <SPOKE_AUTOMATIC_RELAYER_ADDRESS> <MAGISTRATE_ADDRESS>

# vHMT
npx hardhat verify --network <network> <HUB_VOTE_TOKEN_ADDRESS> <HMT_TOKEN_ADDRESS>
```

Adjust arguments/order if constructors change; consult the contract sources if verification fails.

## Troubleshooting

- Wrong Wormhole chain IDs or relayer addresses will cause messages to be dropped. Double-check per network.
- Insufficient ETH for relayer fees: increase the value sent on `crossChainPropose` / `requestCollections` or fund the signer.
- Not enough voting power: ensure holders self-delegate on Hub/Spokes.
- Updating Spokes requires Governor ownership; if owned by Timelock, execute an ownership-protected transaction via Timelock.

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
