import { ChainId } from '@human-protocol/sdk';

export const V2_SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.POLYGON_AMOY,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.X_LAYER,
  // ChainId.SKALE,
  // ChainId.AVALANCHE,
  // ChainId.AVALANCHE_TESTNET,
];

export const SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.POLYGON_AMOY,
  ChainId.SKALE,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.AVALANCHE,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.X_LAYER,
];

export const L1_L2_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.POLYGON,
  ChainId.SKALE,
  ChainId.MOONBEAM,
  ChainId.AVALANCHE,
  ChainId.X_LAYER,
];

export const TESTNET_CHAIN_IDS = [
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.POLYGON_AMOY,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.CELO_ALFAJORES,
  ChainId.X_LAYER,
];

export const FAUCET_CHAIN_IDS = [
  ChainId.GOERLI,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.POLYGON_AMOY,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.SKALE,
  ChainId.CELO_ALFAJORES,
  ChainId.X_LAYER,
];

export const RPC_URLS: {
  [chainId in ChainId]?: string;
} = {
  [ChainId.MAINNET]:
    'https://eth-mainnet.g.alchemy.com/v2/VVDrD3TpJv8ZBP4CiwH2m5Oj6r0hM2st',
  [ChainId.GOERLI]:
    'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  [ChainId.BSC_MAINNET]: 'https://bsc-dataseed1.binance.org/',
  [ChainId.BSC_TESTNET]: 'https://bsc-testnet.publicnode.com',
  [ChainId.POLYGON]: 'https://polygon-rpc.com/',
  [ChainId.POLYGON_MUMBAI]: 'https://rpc-mumbai.maticvigil.com',
  [ChainId.POLYGON_AMOY]:
    'https://polygon-amoy.g.alchemy.com/v2/Jomagi_shxwCUrKtZfgZepvngWRuO8-e',
  [ChainId.MOONBEAM]: 'https://rpc.api.moonbeam.network',
  [ChainId.MOONBASE_ALPHA]: 'https://rpc.api.moonbase.moonbeam.network',
  [ChainId.AVALANCHE_TESTNET]: 'https://api.avax-test.network/ext/C/rpc',
  [ChainId.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
  [ChainId.SKALE]: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
  [ChainId.CELO_ALFAJORES]: 'https://alfajores-forno.celo-testnet.org',
  [ChainId.CELO]: 'https://forno.celo.org',
  [ChainId.X_LAYER]: 'https://www.okx.com/explorer/xlayer-test',
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
