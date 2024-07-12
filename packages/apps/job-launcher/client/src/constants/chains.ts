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
      ChainId.POLYGON_MUMBAI,
      ChainId.GOERLI,
    ];
    break;
  case 'localhost':
  default:
    SUPPORTED_CHAIN_IDS = [ChainId.LOCALHOST];
    break;
}

export const CHAIN_ID_BY_NAME: Record<string, number> = {
  'Polygon Mumbai': ChainId.POLYGON_MUMBAI,
  'Binance Smart Chain': ChainId.BSC_MAINNET,
  'Ethereum Goerli': ChainId.GOERLI,
  Localhost: ChainId.LOCALHOST,
};

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
  [ChainId.CELO_ALFAJORES]: 'https://alfajores-forno.celo-testnet.org',
  [ChainId.CELO]: 'https://forno.celo.org',
};
