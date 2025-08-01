import * as dotenv from 'dotenv';

import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomicfoundation/hardhat-chai-matchers';
import '@typechain/hardhat';
import 'xdeployer';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import 'hardhat-abi-exporter';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import 'hardhat-dependency-compiler';

dotenv.config();

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
    compilers: [
      {
        version: '0.6.2',
      },
      {
        version: '0.8.23',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 10,
          },
        },
      },
    ],
  },
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: `http://127.0.0.1:${process.env.RPC_PORT || '8545'}`,
    },
    hardhat: {
      forking: process.env.FORKING_URL
        ? {
            url: process.env.FORKING_URL,
          }
        : undefined,
      chainId: 1338,
      initialBaseFeePerGas: 0,
    },
    mainnet: {
      chainId: 1,
      url: process.env.ETH_MAINNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.ETH_SEPOLIA_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    polygon: {
      chainId: 137,
      url: process.env.ETH_POLYGON_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    polygonAmoy: {
      chainId: 80002,
      url: process.env.ETH_POLYGON_AMOY_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    bsc: {
      chainId: 56,
      url: process.env.ETH_BSC_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    bscTestnet: {
      chainId: 97,
      url: process.env.ETH_BSC_TESTNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
    },
    auroraTestnet: {
      chainId: 1313161555,
      url: process.env.ETH_AURORA_TESTNET_URL || '',
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      timeout: 2000000,
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
  abiExporter: [
    {
      path: './abis',
      runOnCompile: true,
      clear: true,
      flat: true,
      only: ['contracts/[a-zA-Z]*.sol'],
      spacing: 2,
      format: 'json',
    },
    {
      path: './abis/legacy',
      runOnCompile: true,
      clear: true,
      flat: true,
      only: ['contracts/legacy/[a-zA-Z]*.sol'],
      spacing: 2,
      format: 'json',
    },
    {
      path: './abis/governance',
      runOnCompile: true,
      clear: true,
      flat: true,
      only: ['contracts/governance/[a-zA-Z]*.sol'],
      spacing: 2,
      format: 'json',
    },
  ],
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || '',
      bsc: process.env.BSC_API_KEY || '',
      bscTestnet: process.env.BSC_API_KEY || '',
      auroraTestnet: 'empty',
    },
    customChains: [
      {
        network: 'auroraTestnet',
        chainId: 1313161555,
        urls: {
          apiURL: 'https://explorer.testnet.aurora.dev/api',
          browserURL: 'http://explorer.testnet.aurora.dev',
        },
      },
    ],
  },
  mocha: {
    timeout: 200000,
  },
  dependencyCompiler: {
    paths: ['@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol'],
  },
};

export default config;
