<p align="center">
  <a href="https://www.humanprotocol.org/" target="blank"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/10347.png" width="100" alt="Human Protocol" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<h1 align="center">Human Protocol Core</h1>
<p align="center">This is the package of the human protocol smart contracts.</p>

<p align="center">
  <a href="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml">
    <img src="https://github.com/humanprotocol/human-protocol/actions/workflows/ci-test-core.yaml/badge.svg?branch=main" alt="Core Check">
  </a>
</p>

## Documentation

For detailed information about the core contracts, please refer to the [Human Protocol Tech Docs](https://docs.humanprotocol.org/hub/human-tech-docs/architecture/components/smart-contracts).

## Deployment

### Deploy contracts with proxy to a live network

1. Create a .env file in the root folder of core package, with the following variables(this is an example for Polygon Amoy, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_AMOY_URL=
PRIVATE_KEY=
HMT_ADDRESS=
POLYGONSCAN_API_KEY=
```

2. Open `./scripts/deploy-proxies.ts` and check if you actually need to deploy all the contracts this script deploys.

3. Deploy the contracts runing this ([NETWORK_NAME] = network name from `hardhat.config.ts`):

```bash
yarn deploy:proxy --network [NETWORK_NAME]
```

4. Verify every contract runing the following line for each contract address(for those that use a proxy just verifyin the proxy will verify the implementation too):

```bash
yarn dlx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

5. Request the Human Protocol team to include the new contract address in the document at https://tech-docs.humanprotocol.org/contracts/contract-addresses.

### Upgrade contracts with proxy

1. Create a .env file in the root folder of core package, with the following variables(this is an example to update EscrowFactory on Polygon Amoy, if you want to upgrade
   more proxies you need to add the corresponding addresses. Also, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_AMOY_URL=
PRIVATE_KEY=
POLYGONSCAN_API_KEY=
ESCROW_FACTORY_ADDRESS=
```

2. Open `./scripts/upgrade-proxies.ts` and add all the proxies you actually need to upgrade.

3. Compile the contract runing this:

```bash
yarn compile
```

4. Deploy the upgraded contract runing this ([NETWORK_NAME] = network name from `hardhat.config.ts`):

```bash
yarn upgrade:proxy --network [NETWORK_NAME]
```

5. Verify the contract runing the following line:

```bash
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/humanprotocol/human-protocol/blob/main/LICENSE) file for details.
