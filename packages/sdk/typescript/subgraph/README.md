<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Human subgraph</h1>
<p align="center">This is the repo of the human subgraph.
The goal of the subgraph is to index all of the emissions for Human Protocol
To get more information about how the graph works : 
<a href="https://thegraph.com/en/">https://thegraph.com/en/</a>
</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-subgraph.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-subgraph.yaml/badge.svg?branch=main" alt="Subgraph Check">
  </a>
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-subgraph.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/cd-subgraph.yaml/badge.svg?branch=main" alt="Subgraph deployment">
  </a>
</p>

## Installation

Package installation

```
yarn install && yarn workspace human-protocol build:core
```

## Development
### Tests

To run tests next commands should be executed:

```bash
NETWORK=polygon yarn generate

yarn codegen

yarn build

yarn test
```

### e2e test using local node
You can e2e test subgraph changes by running blockchain and graph node locally. To do so, first you will need to run necessary infra in Docker:
```bash
yarn workspace human-protocol docker:web3-up
```
> In case you already have such infra running and want a clean start w/o previous data - run `yarn workspace human-protocol docker:web3-down` first

After you have the infra running:
```bash
# Generate artifacts for running subgraph on localhost
NETWORK=localhost yarn generate
# Create graph for localhost
yarn create-local
# Deploy the graph
yarn deploy-local
```
After that subgraph should be available on `http://0.0.0.0:8000/subgraphs/name/humanprotocol/localhost`

## 🏊 Deploying graphs for live networks

1. Generate & deploy on matic

```bash
yarn quickstart:matic
```

2. Generate & deploy on goerli

```bash
yarn quickstart:goerli
```

You can access it on `http://localhost:8020/`

### Deploy the graph

The deployment of the graph on each network is automatically triggered by the github CI when mofications are made on the subgraph.

### Supported networks

Following networks are supported :

- Ethereum Mainnet
- Sepolia (testnet)
- BSC Mainnet
- BSC Testnet (testnet)
- Polygon/matic
- Polygon Amoy (testnet)

# Add a new network

You can find networks configuration in the directory `config`. Each JSON file is use to generate the `subgraph.yaml` file for each network.

1. Add your network configuration as `config/NETWORK.json`
2. Run authentication command: `yarn dlx graph auth --product hosted-service [AUTH_TOKEN]`
3. Generate `NETWORK=[NETWORK] yarn generate`
4. Go to your hosted [service dashboard](https://thegraph.com/hosted-service/dashboard) and create the new subgraph
5. Deploy the subgraph `yarn dlx graph deploy --product hosted-service humanprotocol/[SUBGRAPH_NAME]`
6. On the `./.github/workflows/cd-subgraph.yaml` add your network name and graph name.

# Existing subgraphs

- https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v1
- https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai
- https://api.thegraph.com/subgraphs/name/humanprotocol/polygon
- https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam
- https://api.thegraph.com/subgraphs/name/humanprotocol/rinkeby
- https://api.thegraph.com/subgraphs/name/humanprotocol/goerli
- https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest
- https://api.thegraph.com/subgraphs/name/humanprotocol/bsc
- https://api.thegraph.com/subgraphs/name/humanprotocol/celo
- https://api.thegraph.com/subgraphs/name/humanprotocol/celo-alfajores
- https://www.okx.com/api/v1/x1-testnet/index/subgraphs/name/human-protocol-x1-testnet/graphql

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.