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

### Add a new network

You can find networks configuration in the directory `config`. Each JSON file is use to generate the `subgraph.yaml` file for each network.

1. Add your network configuration as `config/NETWORK.json`
2. On the `package.json` file add the command `npm run quickstart:{NETWORK}`
3. On the `./.github/workflows/deploy.yaml` file add these 3command at the end of the file
   - run: node ./scripts/generatenetworkssubgraphs.js {yourNetworkName}
   - run: npm run codegen
   - run: graph deploy --product hosted-service humanprotocol/{yourNetworkName}

Currently deploying to:

- main branch -> https://thegraph.com/hosted-service/subgraph/humanprotocol/polygon

- goerli branch -> https://thegraph.com/hosted-service/subgraph/humanprotocol/goerli

- mumbai branch -> https://thegraph.com/hosted-service/subgraph/humanprotocol/mumbai
