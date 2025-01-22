import { ChainId } from '@human-protocol/sdk';

export const IS_MAINNET =
  import.meta.env.VITE_APP_ENVIRONMENT.toLowerCase() === 'mainnet';
export const IS_TESTNET = !IS_MAINNET;

let initialSupportedChainIds: ChainId[];
switch (import.meta.env.VITE_APP_ENVIRONMENT.toLowerCase()) {
  case 'mainnet':
    initialSupportedChainIds = [ChainId.POLYGON];
    break;
  case 'testnet':
    initialSupportedChainIds = [
      ChainId.BSC_TESTNET,
      ChainId.POLYGON_AMOY,
      ChainId.SEPOLIA,
      ChainId.XLAYER_TESTNET,
    ];
    break;
  case 'localhost':
  default:
    initialSupportedChainIds = [ChainId.LOCALHOST];
    break;
}

const supportedChains =
  import.meta.env.VITE_APP_SUPPORTED_CHAINS?.split(',') || [];

export const SUPPORTED_CHAIN_IDS: ChainId[] = initialSupportedChainIds.filter(
  (chainId) => supportedChains.includes(chainId.toString())
);

if (SUPPORTED_CHAIN_IDS.length === 0) {
  throw new Error(
    'No valid RPC URL provided for the supported blockchain environment'
  );
}

export const LOCALHOST = {
  id: 1338,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};
