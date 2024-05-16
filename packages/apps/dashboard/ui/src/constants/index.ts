import { ChainId } from '@human-protocol/sdk';

export const V2_SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.SEPOLIA,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_AMOY,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.XLAYER,
  ChainId.XLAYER_TESTNET,
  // ChainId.SKALE,
  // ChainId.AVALANCHE,
  // ChainId.AVALANCHE_TESTNET,
];

export const FAUCET_CHAIN_IDS = [
  ChainId.SEPOLIA,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_AMOY,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.SKALE,
  ChainId.CELO_ALFAJORES,
  ChainId.XLAYER_TESTNET,
];

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
  [ChainId.XLAYER]: import.meta.env.VITE_APP_RPC_URL_XLAYER || '',
  [ChainId.XLAYER_TESTNET]:
    import.meta.env.VITE_APP_RPC_URL_XLAYER_TESTNET || '',
};

export const FAST_INTERVAL = 10_000;
export const SLOW_INTERVAL = 60_000;

export const ROLES = [
  'Validator',
  'Operator (Job Launcher)',
  'Exchange Oracle',
  'Reputation Oracle',
  'Recording Oracle',
];

export const HM_TOKEN_DECIMALS = 18;

export const STAKING_CONTRACT_ADDRESS =
  '0x1fA701df2bb75f2cE8B6439669BD1eCfCf8b26fe';

export const BITFINEX_SUPPORTED_CHAIN_IDS = [ChainId.MAINNET, ChainId.POLYGON];

export const BITFINEX_HOT_WALLET_ADDRESS =
  '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec';
