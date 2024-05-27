import { ChainId } from '@human-protocol/sdk';
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

export const RPC_URLS: Partial<Record<ChainId, string | undefined>> = {
  [ChainId.MAINNET]: import.meta.env.VITE_APP_RPC_URL_MAINNET || '',
  [ChainId.SEPOLIA]: import.meta.env.VITE_APP_RPC_URL_SEPOLIA || '',
  [ChainId.BSC_MAINNET]: import.meta.env.VITE_APP_RPC_URL_BSC_MAINNET || '',
  [ChainId.BSC_TESTNET]: import.meta.env.VITE_APP_RPC_URL_BSC_TESTNET || '',
  [ChainId.POLYGON]: import.meta.env.VITE_APP_RPC_URL_POLYGON || '',
  [ChainId.POLYGON_AMOY]: import.meta.env.VITE_APP_RPC_URL_POLYGON_AMOY || '',
  [ChainId.MOONBEAM]: import.meta.env.VITE_APP_RPC_URL_MOONBEAM || '',
  [ChainId.MOONBASE_ALPHA]:
    import.meta.env.VITE_APP_RPC_URL_MOONBASE_ALPHA || '',
  [ChainId.AVALANCHE_TESTNET]:
    import.meta.env.VITE_APP_RPC_URL_AVALANCHE_TESTNET || '',
  [ChainId.AVALANCHE]: import.meta.env.VITE_APP_RPC_URL_AVALANCHE || '',
  [ChainId.SKALE]: import.meta.env.VITE_APP_RPC_URL_SKALE || '',
  [ChainId.CELO_ALFAJORES]:
    import.meta.env.VITE_APP_RPC_URL_CELO_ALFAJORES || '',
  [ChainId.CELO]: import.meta.env.VITE_APP_RPC_URL_CELO || '',
  [ChainId.XLAYER]: import.meta.env.VITE_APP_RPC_URL_XLAYER || '',
  [ChainId.XLAYER_TESTNET]:
    import.meta.env.VITE_APP_RPC_URL_XLAYER_TESTNET || '',
  [ChainId.LOCALHOST]: 'http://127.0.0.1:8545',
};

export const SUPPORTED_CHAIN_IDS: ChainId[] = initialSupportedChainIds.filter(
  (chainId) => Boolean(RPC_URLS[chainId]),
);

// it no rpc set, throw error
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
