# Human subgraph project

This is the repo of the human subgraph.
The goal of the subgraph is to index all of the emissions for Escrow and Escrow Factories
To get more information about how the graph works : https://thegraph.com/en/

## Installation

Package installation

```
npm install
```

## 🏊 Deploying graphs for live networks

1. Generate & deploy on matic

```bash
npm run quickstart:matic
```

2. Generate & deploy on goerli

```bash
npm run quickstart:goerli
```

You can access it on `http://localhost:8020/`

### Deploy the graph

The deployment of the graph on each network is automatically triggered by the github CI when mofications are made on the subgraph.

### Tests

To run tests next commands should be executed:

```bash
npm run codegen

npm run build

npm test
```

### Supported networks

Following networks are supported :

- Polygon/matic
- Goerli
- Polygon Mumbai (testnet)

# Add a new network

You can find networks configuration in the directory `config`. Each JSON file is use to generate the `subgraph.yaml` file for each network.

1. Add your network configuration as `config/NETWORK.json`
2. Run authentication command: `npx graph auth --product hosted-service [AUTH_TOKEN]`
3. Generate `NETWORK=[NETWORK] yarn generate`
4. Go to your hosted [service dashboard](https://thegraph.com/hosted-service/dashboard) and create the new subgraph
5. Deploy the subgraph `npx graph deploy --product hosted-service humanprotocol/[SUBGRAPH_NAME]`
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
- https://graph-skale.humanprotocol.org/subgraphs/name/skale-human
