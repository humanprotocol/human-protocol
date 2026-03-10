<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

<h1 align="center">Human HMT statistics subgraph</h1>
<p align="center">
Dedicated subgraph to index HMToken statistics only.
</p>

## Installation

Package installation:

```bash
yarn install && yarn workspace human-protocol build:core
```

## Development

Generate and build artifacts for a network:

```bash
NETWORK=polygon yarn workspace @tools/subgraph-hmt generate
NETWORK=polygon yarn workspace @tools/subgraph-hmt build
```

### Tests

To run subgraph tests:

```bash
NETWORK=polygon yarn workspace @tools/subgraph-hmt generate
yarn workspace @tools/subgraph-hmt test
```

This subgraph does not use staking/escrow templates.

## Indexed entities

- `HMTokenStatistics`
- `Holder`
- `UniqueSender`
- `UniqueReceiver`
- `EventDayData` (HMT daily fields only)

## Supported networks

- Ethereum Mainnet
- Sepolia (testnet)
- BSC Mainnet
- BSC Testnet (testnet)
- Polygon Mainnet
- Polygon Amoy (testnet)
- Localhost

## Add a new network

1. Add network configuration as `config/NETWORK.json`.
2. Ensure required fields are present:
   - `network`
   - `description`
   - `HMToken.address`
   - `HMToken.startBlock`
   - `HMToken.abi`
3. Generate artifacts: `NETWORK=NETWORK yarn workspace @tools/subgraph-hmt generate`.
4. Build subgraph: `yarn workspace @tools/subgraph-hmt build`.
