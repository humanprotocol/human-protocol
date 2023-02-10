import {
  goerli,
  bsc,
  bscTestnet,
  polygon,
  polygonMumbai,
  moonbeam,
  Chain,
  moonbaseAlpha,
  avalancheFuji,
  avalanche,
} from 'wagmi/chains';

export enum ChainId {
  ALL = -1,
  MAINNET = 1,
  RINKEBY = 4,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
  MOONBASE_ALPHA = 1287,
  AVALANCHE_TESTNET = 43113,
  AVALANCHE = 43114,
}
const rinkeby = {
  id: ChainId.RINKEBY,
  name: 'Ethereum Rinkeby',
  network: 'rinkeby',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: {
      http: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    },
    default: {
      http: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    },
  },
  blockExplorers: {
    etherscan: {
      name: 'rinkeby etherscan',
      url: 'https://rinkeby.etherscan.io',
    },
    default: { name: 'rinkebyetherscan', url: 'https://rinkeby.etherscan.io' },
  },
} as const satisfies Chain;
export const HMT_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
  [ChainId.POLYGON]: '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf',
  [ChainId.AVALANCHE]: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
};

export interface IEscrowNetwork {
  chainId: number;
  title: string;
  scanUrl: string;
  rpcUrl: string;
  subgraphUrl: string;
  hmtAddress: string;
  factoryAddress: string;

  kvstoreAddress: string;
  wagmiChain: Chain;
  oldSubgraphUrl: string;
  oldFactoryAddress: string;
}

export const SUPPORTED_CHAIN_IDS = [
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_MAINNET,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.MOONBEAM,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
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

export const ESCROW_NETWORKS: {
  [chainId in ChainId]?: IEscrowNetwork;
} = {
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    title: 'Ethereum Rinkeby',
    scanUrl: 'https://rinkeby.etherscan.io',
    rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    subgraphUrl: '',
    factoryAddress: '0x925B24444511c86F4d4E63141D8Be0A025E2dca4',
    hmtAddress: '0x4dCf5ac4509888714dd43A5cCc46d7ab389D9c23',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
    kvstoreAddress: '',
    wagmiChain: rinkeby,
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    scanUrl: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli-v1',
    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    oldFactoryAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
    kvstoreAddress: '0xc9Fe39c4b6e1d7A2991355Af159956982DADf842',
    wagmiChain: goerli,
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    scanUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc-v1',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
    oldSubgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
    oldFactoryAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',
    wagmiChain: bsc,
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    scanUrl: 'https://testnet.bscscan.com',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest-v1',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
    oldFactoryAddress: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
    kvstoreAddress: '0x3aD4B091E054f192a822D1406f4535eAd38580e4',
    wagmiChain: bscTestnet,
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    title: 'Polygon',
    scanUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com/',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v1',
    factoryAddress: '0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB',
    hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    oldFactoryAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
    kvstoreAddress: '0x35Cf4beBD58F9C8D75B9eA2599479b6C173d406F',
    wagmiChain: polygon,
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    scanUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v1',
    factoryAddress: '0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d',
    hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai',
    oldFactoryAddress: '0x558cd800f9F0B02f3B149667bDe003284c867E94',
    kvstoreAddress: '0xD7F61E812e139a5a02eDae9Dfec146E1b8eA3807',
    wagmiChain: polygonMumbai,
  },
  [ChainId.MOONBEAM]: {
    chainId: ChainId.MOONBEAM,
    title: 'Moonbeam',
    scanUrl: 'https://moonbeam.moonscan.io',
    rpcUrl: 'https://rpc.api.moonbeam.network',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam-v1',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
    oldFactoryAddress: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',
    wagmiChain: moonbeam,
  },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    scanUrl: 'https://moonbase.moonscan.io/',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbase-alpha-v1',
    factoryAddress: '0x707fb5A5d36BC15275Af3f73262bf9a1D8C470EB',
    hmtAddress: '0xe4C8eC5d057EacF40060b2174627a4941a5c8127',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
    kvstoreAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    wagmiChain: moonbaseAlpha,
  },
  [ChainId.AVALANCHE_TESTNET]: {
    chainId: ChainId.AVALANCHE_TESTNET,
    title: 'Fuji C-Chain',
    scanUrl: 'https://testnet.snowtrace.io',
    rpcUrl: 'https://api.avax-test.network/ext/C/rpc',
    // Subgraph hasn't been implemented yet
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche',
    factoryAddress: '0xfb4469201951C3B9a7F1996c477cb7BDBEcE0A88',
    hmtAddress: '0x9406d5c635AD22b0d76c75E52De57A2177919ca3',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
    kvstoreAddress: '0xd232c1426CF0653cE8a71DC98bCfDf10c471c114',
    wagmiChain: avalancheFuji,
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    title: 'Avalanche C-Chain Mainnet',
    scanUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    // Subgraph hasn't been implemented yet
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/fuji',
    factoryAddress: '0x9767a578ba7a5FA1563c8229943cB01cd8446BB4',
    hmtAddress: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
    kvstoreAddress: '0x4B79eaD28F52eD5686bf0e379717e85fc7aD10Df',
    wagmiChain: avalanche,
  },
};

export const FAST_INTERVAL = 10_000;
export const SLOW_INTERVAL = 60_000;

export const ROLES = [
  'Operator (Job Launcher)',
  'Validator',
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
