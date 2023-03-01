export enum ChainId {
  ALL = -1,
  MAINNET = 1,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
  LOCALHOST = 1338,
  SKALE = 1273227453,
}

export const SUPPORTED_CHAIN_IDS_PRODUCTION = [
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.MOONBEAM,
  ChainId.SKALE,
];

export const SUPPORTED_CHAIN_IDS =
  process.env.NODE_ENV === 'development'
    ? [ChainId.LOCALHOST]
    : SUPPORTED_CHAIN_IDS_PRODUCTION;

export interface IEscrowNetwork {
  chainId: number;
  title: string;
  scanUrl: string;
  rpcUrl: string;
  subgraphUrl: string;
  hmtAddress: string;
  factoryAddress: string;
}

export const ESCROW_NETWORKS: {
  [chainId in ChainId]?: IEscrowNetwork;
} = {
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    scanUrl: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
  },
  // [ChainId.BSC_MAINNET]: {
  //   chainId: ChainId.BSC_MAINNET,
  //   title: 'Binance Smart Chain',
  //   scanUrl: 'https://bscscan.com',
  //   rpcUrl: 'https://bsc-dataseed1.binance.org/',
  //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
  //   factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
  //   hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
  // },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    scanUrl: 'https://testnet.bscscan.com',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
  },
  // [ChainId.POLYGON]: {
  //   chainId: ChainId.POLYGON,
  //   title: 'Polygon',
  //   scanUrl: 'https://polygonscan.com',
  //   rpcUrl: 'https://polygon-rpc.com/',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
  //   factoryAddress: '0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB',
  //   hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
  // },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    scanUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v1',
    factoryAddress: '0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d',
    hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
  },
  //[ChainId.SKALE]: {
  //  chainId: ChainId.SKALE,
  //  title: 'SKALE Human Protocol chain',
  //  scanUrl: ' https://wan-red-ain.explorer.mainnet.skalenodes.com/',
  //  rpcUrl: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
  //  subgraphUrl: '',
  //  factoryAddress: '0x27B423cE73d1dBdB48d2dd351398b5Ce8223117c',
  //  hmtAddress: '0xa91B2C7d9704aeE8918460fc4375866e2c415A67',
  //},
  // [ChainId.MOONBEAM]: {
  //   chainId: ChainId.MOONBEAM,
  //   title: 'Moonbeam',
  //   scanUrl: 'https://moonbeam.moonscan.io',
  //   rpcUrl: 'https://rpc.api.moonbeam.network',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
  //   factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
  //   hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
  // },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    scanUrl: '',
    rpcUrl: 'http://127.0.0.1:8545',
    subgraphUrl: '',
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
};

export const HM_TOKEN_DECIMALS = 18;

export const Currencies = [
  'USD',
  'EUR',
  'AED',
  'ARS',
  'AUD',
  'BDT',
  'BMD',
  'BRL',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'CZK',
  'DKK',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'KRW',
  'LKR',
  'MMK',
  'MXN',
  'MYR',
  'NGN',
  'NOK',
  'NZD',
  'PHP',
  'PKR',
  'PLN',
  'RUB',
  'SAR',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'UAH',
  'VND',
  'ZAR',
];
