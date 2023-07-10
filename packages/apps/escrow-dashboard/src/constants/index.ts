import { ChainId } from '@human-protocol/sdk';

export const HMT_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
  [ChainId.POLYGON]: '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf',
  [ChainId.AVALANCHE]: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
  [ChainId.SKALE]: '0x6E5FF61Ea88270F6142E0E0eC8cbe9d67476CbCd',
};

export const SUPPORTED_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.SKALE,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.AVALANCHE,
];

export const L1_L2_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.POLYGON,
  ChainId.SKALE,
  ChainId.MOONBEAM,
  ChainId.AVALANCHE,
];

export const TESTNET_CHAIN_IDS = [
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
];

export const FAUCET_CHAIN_IDS = [
  ChainId.GOERLI,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.SKALE,
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
  [ChainId.MOONBEAM]: 'https://rpc.api.moonbeam.network',
  [ChainId.MOONBASE_ALPHA]: 'https://rpc.api.moonbase.moonbeam.network',
  [ChainId.AVALANCHE_TESTNET]: 'https://api.avax-test.network/ext/C/rpc',
  [ChainId.AVALANCHE]: 'https://api.avax.network/ext/bc/C/rpc',
  [ChainId.SKALE]: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
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
