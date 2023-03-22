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
  skaleHumanProtocol,
} from 'wagmi/chains';

import { EscrowNetwork } from 'src/types';

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
  SKALE = 1273227453,
}

export const HMT_ADDRESSES: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
  [ChainId.POLYGON]: '0xc748b2a084f8efc47e086ccddd9b7e67aeb571bf',
  [ChainId.AVALANCHE]: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
  [ChainId.SKALE]: '0xa91B2C7d9704aeE8918460fc4375866e2c415A67',
};

export const SUPPORTED_CHAIN_IDS = [
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

export const ESCROW_NETWORKS: {
  [chainId in ChainId]?: EscrowNetwork;
} = {
  // TODO: Remove Rinkeby from supported chainlist
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    title: 'Ethereum Rinkeby',
    scanUrl: 'https://rinkeby.etherscan.io',
    rpcUrl: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    subgraphUrl: '',
    wagmiChain: {} as Chain,

    factoryAddress: '0x925B24444511c86F4d4E63141D8Be0A025E2dca4',
    hmtAddress: '0x4dCf5ac4509888714dd43A5cCc46d7ab389D9c23',
    stakingAddress: '',
    kvstoreAddress: '',

    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    scanUrl: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli-v1',
    wagmiChain: goerli,

    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
    stakingAddress: '0xf46B45Df3d956369726d8Bd93Ba33963Ab692920',
    kvstoreAddress: '0xc9Fe39c4b6e1d7A2991355Af159956982DADf842',

    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    oldFactoryAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    scanUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc-v1',
    wagmiChain: bsc,

    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
    stakingAddress: '0xC2163A0928034e020f0d31e1171Ba0D6d9AfFB6c',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',

    oldSubgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
    oldFactoryAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    scanUrl: 'https://testnet.bscscan.com',
    rpcUrl: 'https://endpoints.omniatech.io/v1/bsc/testnet/public',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest-v1',
    wagmiChain: bscTestnet,

    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    stakingAddress: '0x5517fE916Fe9F8dB15B0DDc76ebDf0BdDCd4ed18',
    kvstoreAddress: '0x3aD4B091E054f192a822D1406f4535eAd38580e4',

    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
    oldFactoryAddress: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    title: 'Polygon',
    scanUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com/',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v1',
    wagmiChain: polygon,

    factoryAddress: '0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB',
    hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
    stakingAddress: '0xcbAd56bE3f504E98bd70875823d3CC0242B7bB29',
    kvstoreAddress: '0x35Cf4beBD58F9C8D75B9eA2599479b6C173d406F',

    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    oldFactoryAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    scanUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v1',
    wagmiChain: polygonMumbai,

    factoryAddress: '0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d',
    hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
    stakingAddress: '0x7Fd3dF914E7b6Bd96B4c744Df32183b51368Bfac',
    kvstoreAddress: '0xD7F61E812e139a5a02eDae9Dfec146E1b8eA3807',

    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai',
    oldFactoryAddress: '0x558cd800f9F0B02f3B149667bDe003284c867E94',
  },
  [ChainId.MOONBEAM]: {
    chainId: ChainId.MOONBEAM,
    title: 'Moonbeam',
    scanUrl: 'https://moonbeam.moonscan.io',
    rpcUrl: 'https://rpc.api.moonbeam.network',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam-v1',
    wagmiChain: moonbeam,

    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
    stakingAddress: '0x05398211bA2046E296fBc9a9D3EB49e3F15C3123',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',

    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
    oldFactoryAddress: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
  },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    scanUrl: 'https://moonbase.moonscan.io/',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbase-alpha-v1',
    wagmiChain: moonbaseAlpha,

    factoryAddress: '0x5e622FF522D81aa426f082bDD95210BC25fCA7Ed',
    hmtAddress: '0x2dd72db2bBA65cE663e476bA8b84A1aAF802A8e3',
    stakingAddress: '0xBFC7009F3371F93F3B54DdC8caCd02914a37495c',
    kvstoreAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',

    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.AVALANCHE_TESTNET]: {
    chainId: ChainId.AVALANCHE_TESTNET,
    title: 'Fuji C-Chain',
    scanUrl: 'https://testnet.snowtrace.io',
    rpcUrl: 'https://api.avax-test.network/ext/C/rpc',
    // Subgraph hasn't been implemented yet
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/fuji',
    wagmiChain: avalancheFuji,

    factoryAddress: '0xfb4469201951C3B9a7F1996c477cb7BDBEcE0A88',
    hmtAddress: '0x9406d5c635AD22b0d76c75E52De57A2177919ca3',
    stakingAddress: '',
    kvstoreAddress: '0xd232c1426CF0653cE8a71DC98bCfDf10c471c114',

    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    title: 'Avalanche C-Chain Mainnet',
    scanUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    // Subgraph hasn't been implemented yet
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche',
    wagmiChain: avalanche,

    factoryAddress: '0x9767a578ba7a5FA1563c8229943cB01cd8446BB4',
    hmtAddress: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
    stakingAddress: '',
    kvstoreAddress: '0x4B79eaD28F52eD5686bf0e379717e85fc7aD10Df',

    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.SKALE]: {
    chainId: ChainId.SKALE,
    title: 'SKALE Human Protocol Chain',
    scanUrl: 'https://wan-red-ain.explorer.mainnet.skalenodes.com/',
    rpcUrl: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
    subgraphUrl:
      'https://graph-skale.humanprotocol.org/subgraphs/name/skale-human',
    wagmiChain: skaleHumanProtocol,

    factoryAddress: '0x27B423cE73d1dBdB48d2dd351398b5Ce8223117c',
    hmtAddress: '0xa91B2C7d9704aeE8918460fc4375866e2c415A67',
    stakingAddress: '0xcc98Ad1C0915e271650e43714B20272AC947Ba9A',
    kvstoreAddress: '0xE1055607327b1be2080D31211dCDC4D9338CaF4A',

    oldSubgraphUrl: '',
    oldFactoryAddress: '0x1cE8d1820D60fF792bd6E59EbFf3C9b1089808c0',
  },
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
