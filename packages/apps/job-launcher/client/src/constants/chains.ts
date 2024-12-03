import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { ERROR_MESSAGES } from './index';

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
  (chainId) => supportedChains.includes(chainId.toString()),
);

if (SUPPORTED_CHAIN_IDS.length === 0) {
  throw new Error(ERROR_MESSAGES.noRpcUrl);
}

export const CHAIN_ID_BY_NAME: Record<string, ChainId> = {
  'Polygon Amoy': ChainId.POLYGON_AMOY,
  'Binance Smart Chain': ChainId.BSC_MAINNET,
  'Ethereum Sepolia': ChainId.SEPOLIA,
  Localhost: ChainId.LOCALHOST,
};

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

export const NETWORK_TOKENS: Record<
  ChainId,
  { [key: string]: string | undefined }
> = {
  [ChainId.POLYGON]: {
    hmt: NETWORKS[ChainId.POLYGON]?.hmtAddress,
  },
  [ChainId.SEPOLIA]: {
    hmt: NETWORKS[ChainId.SEPOLIA]?.hmtAddress,
    usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  [ChainId.POLYGON_AMOY]: {
    hmt: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress,
  },
  [ChainId.ALL]: { hmt: NETWORKS[ChainId.ALL]?.hmtAddress },
  [ChainId.MAINNET]: { hmt: NETWORKS[ChainId.MAINNET]?.hmtAddress },
  [ChainId.RINKEBY]: { hmt: NETWORKS[ChainId.RINKEBY]?.hmtAddress },
  [ChainId.GOERLI]: { hmt: NETWORKS[ChainId.GOERLI]?.hmtAddress },
  [ChainId.BSC_MAINNET]: { hmt: NETWORKS[ChainId.BSC_MAINNET]?.hmtAddress },
  [ChainId.BSC_TESTNET]: { hmt: NETWORKS[ChainId.BSC_TESTNET]?.hmtAddress },
  [ChainId.POLYGON_MUMBAI]: {
    hmt: NETWORKS[ChainId.POLYGON_MUMBAI]?.hmtAddress,
  },
  [ChainId.MOONBEAM]: { hmt: NETWORKS[ChainId.MOONBEAM]?.hmtAddress },
  [ChainId.MOONBASE_ALPHA]: {
    hmt: NETWORKS[ChainId.MOONBASE_ALPHA]?.hmtAddress,
  },
  [ChainId.AVALANCHE_TESTNET]: {
    hmt: NETWORKS[ChainId.AVALANCHE_TESTNET]?.hmtAddress,
  },
  [ChainId.AVALANCHE]: { hmt: NETWORKS[ChainId.AVALANCHE]?.hmtAddress },
  [ChainId.CELO]: { hmt: NETWORKS[ChainId.CELO]?.hmtAddress },
  [ChainId.CELO_ALFAJORES]: {
    hmt: NETWORKS[ChainId.CELO_ALFAJORES]?.hmtAddress,
  },
  [ChainId.XLAYER_TESTNET]: {
    hmt: NETWORKS[ChainId.XLAYER_TESTNET]?.hmtAddress,
  },
  [ChainId.LOCALHOST]: { hmt: NETWORKS[ChainId.LOCALHOST]?.hmtAddress },
  [ChainId.XLAYER]: { hmt: NETWORKS[ChainId.XLAYER]?.hmtAddress },
};
