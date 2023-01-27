# Human Protocol Core Smart Contracts

- Escrow

- EscrowFactory


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
4. Verify every contract runing the following line for each contract address(have in mind that for contract with proxy, first you need to validate the implementation):
```bash
npx hardhat verify [CONTRACT_ADDRESS] --network [NETWORK_NAME]
```
5. Update the file `CONTRACTS_LIST.md` in the root of this monorepo.