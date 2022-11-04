import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import 'xdeployer';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import * as tdly from '@tenderly/hardhat-tenderly';
import 'hardhat-abi-exporter';
import '@nomicfoundation/hardhat-toolbox';

dotenv.config();

// Turning off the automatic Tenderly verification
tdly.setup({ automaticVerifications: false });

task('accounts', 'Prints the list of accounts', async (_, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    // eslint-disable-next-line no-console
    console.log(account.address);
  }
});

task(
  'balances',
  'Prints the list of accounts and their balances',
  async (_, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
      // eslint-disable-next-line no-console
      console.log(
        account.address +
          ' ' +
          (await hre.ethers.provider.getBalance(account.address))
      );
    }
  }
);

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.9',
  },
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    hardhat: {
      forking: process.env.FORKING_URL
        ? {
            url: process.env.FORKING_URL,
          }
        : undefined,
    },
    tenderly: {
      url: `https://rpc.tenderly.co/fork/${process.env.TENDERLY_FORK_ID}`,
    },
    goerli: {
      chainId: 5,
      url: process.env.ETH_GOERLI_TESTNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
    strict: true,
    only: [],
    except: [],
  },
  abiExporter: {
    path: './abis',
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [],
    spacing: 2,
    format: 'json',
  },
  etherscan: {
    apiKey: {
      // For Mainnet, Goerli
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
    },
  },
  mocha: {
    timeout: 200000,
  },
};

export default config;
