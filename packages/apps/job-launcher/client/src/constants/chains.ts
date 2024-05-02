import { ChainId } from '@human-protocol/sdk';

export const IS_MAINNET =
  import.meta.env.VITE_APP_ENVIRONMENT.toLowerCase() === 'mainnet';
export const IS_TESTNET = !IS_MAINNET;

export let SUPPORTED_CHAIN_IDS: ChainId[];
switch (import.meta.env.VITE_APP_ENVIRONMENT.toLowerCase()) {
  case 'mainnet':
    SUPPORTED_CHAIN_IDS = [ChainId.POLYGON];
    break;
  case 'testnet':
    SUPPORTED_CHAIN_IDS = [
      ChainId.BSC_TESTNET,
      ChainId.POLYGON_AMOY,
      ChainId.SEPOLIA,
    ];
    break;
  case 'localhost':
  default:
    SUPPORTED_CHAIN_IDS = [ChainId.LOCALHOST];
    break;
}

export const CHAIN_ID_BY_NAME: Record<string, number> = {
  'Polygon Amoy': ChainId.POLYGON_AMOY,
  'Binance Smart Chain': ChainId.BSC_MAINNET,
  'Ethereum Sepolia': ChainId.SEPOLIA,
  Localhost: ChainId.LOCALHOST,
};

export const RPC_URLS: {
  [chainId in ChainId]?: string;
} = {
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
};
