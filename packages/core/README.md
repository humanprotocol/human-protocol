# Human Protocol Core Smart Contracts

- Escrow

- EscrowFactory

- HMToken

- Staking

- Reward Pool

- KVStore

# Deploy contracts with proxy to a live network

1. Create a .env file in the root folder of core package, with the following variables(this is an example for Polygon Mumbai, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_MUMBAI_URL=
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
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

5. Update the file `CONTRACTS_LIST.md` in the root of this monorepo.

# Upgrade contracts with proxy

1. Create a .env file in the root folder of core package, with the following variables(this is an example to update EscrowFactory on Polygon Mumbai, if you want to upgrade
   more proxies you need to add the corresponding addresses. Also, for other networks `check hardhat.config.ts`):

```bash
ETH_POLYGON_MUMBAI_URL=
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
