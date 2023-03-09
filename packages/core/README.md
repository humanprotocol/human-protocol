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

4. Verify every contract runing the following line for each contract address(for those that use a proxy just verifyin the proxy will verify the implementation too):

```bash
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```

5. Update the file `CONTRACTS_LIST.md` in the root of this monorepo.

# Upgrade contracts with proxy

1. Create a new script in `./scripts/`.

2. Then, using the method upgradeProxy from `@openzeppelin/hardhat-upgrades` you can upgrade the deployed instance to a new version.
   The new version can be a different contract, or you can just modify the existing contract and recompile it - the plugin will note it changed

Script example ([ESCROW_FACTORY_ADDRESS] = escrow factory address in the chosen network):
```bash
const { ethers, upgrades } = require('hardhat');

async function main() {
  const EscrowFactoryV2 = await ethers.getContractFactory('EscrowFactoryV2');
  const EscrowFactory = await upgrades.upgradeProxy([ESCROW_FACTORY_ADDRESS], EscrowFactoryV2);
  console.log('EscrowFactory upgraded');
}

main();
```

3. Deploy the upgraded contract runing this ([SCRIPT_NAME] = name of new script created and [NETWORK_NAME] = network name from `hardhat.config.ts`):

```bash
npx hardhat run scripts/[SCRIPT_NAME] --network [NETWORK_NAME]
```

4. Verify the contract runing the following line:

```bash
npx hardhat verify --network [NETWORK_NAME] [CONTRACT_ADDRESS]
```
