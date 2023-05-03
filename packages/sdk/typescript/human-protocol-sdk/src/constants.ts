import { ChainId } from './enums';
import { NetworkData } from './types';

/**
 * @constant Default public bucket name
 */
export const DEFAULT_PUBLIC_BUCKET = 'escrow-public-results';

/**
 * @constant Default storage endpoint
 */
export const DEFAULT_ENDPOINT = 'localhost';

/**
 * @constant Default storage port
 */
export const DEFAULT_PORT = 9000;

/**
 * @constant Default storage port
 */
export const DEFAULT_USE_SSL = false;

/**
 * @constant Default network parameters
 */
export const NETWORKS: {
  [chainId in ChainId]?: NetworkData;
} = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    title: 'Ethereum',
    scanUrl: 'https://etherscan.io',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
    stakingAddress: '0x05398211bA2046E296fBc9a9D3EB49e3F15C3123',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mainnet-v1',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.RINKEBY]: {
    chainId: ChainId.RINKEBY,
    title: 'Ethereum Rinkeby',
    scanUrl: 'https://rinkeby.etherscan.io',
    factoryAddress: '0x925B24444511c86F4d4E63141D8Be0A025E2dca4',
    hmtAddress: '0x4dCf5ac4509888714dd43A5cCc46d7ab389D9c23',
    stakingAddress: '',
    kvstoreAddress: '',
    subgraphUrl: '',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    scanUrl: 'https://goerli.etherscan.io',
    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
    stakingAddress: '0xf46B45Df3d956369726d8Bd93Ba33963Ab692920',
    kvstoreAddress: '0xc9Fe39c4b6e1d7A2991355Af159956982DADf842',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli-v1',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    oldFactoryAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    scanUrl: 'https://bscscan.com',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
    stakingAddress: '0xC2163A0928034e020f0d31e1171Ba0D6d9AfFB6c',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',

    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc-v1',
    oldSubgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
    oldFactoryAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    scanUrl: 'https://testnet.bscscan.com',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    stakingAddress: '0x5517fE916Fe9F8dB15B0DDc76ebDf0BdDCd4ed18',
    kvstoreAddress: '0x3aD4B091E054f192a822D1406f4535eAd38580e4',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest-v1',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
    oldFactoryAddress: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    title: 'Polygon',
    scanUrl: 'https://polygonscan.com',
    factoryAddress: '0xBDBfD2cC708199C5640C6ECdf3B0F4A4C67AdfcB',
    hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
    stakingAddress: '0xcbAd56bE3f504E98bd70875823d3CC0242B7bB29',
    kvstoreAddress: '0x35Cf4beBD58F9C8D75B9eA2599479b6C173d406F',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v1',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    oldFactoryAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    scanUrl: 'https://mumbai.polygonscan.com',
    factoryAddress: '0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d',
    hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
    stakingAddress: '0x7Fd3dF914E7b6Bd96B4c744Df32183b51368Bfac',
    kvstoreAddress: '0xD7F61E812e139a5a02eDae9Dfec146E1b8eA3807',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v1',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai',
    oldFactoryAddress: '0x558cd800f9F0B02f3B149667bDe003284c867E94',
  },
  [ChainId.MOONBEAM]: {
    chainId: ChainId.MOONBEAM,
    title: 'Moonbeam',
    scanUrl: 'https://moonbeam.moonscan.io',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
    stakingAddress: '0x05398211bA2046E296fBc9a9D3EB49e3F15C3123',
    kvstoreAddress: '0x70671167176C4934204B1C7e97F5e86695857ef2',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam-v1',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
    oldFactoryAddress: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
  },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    scanUrl: 'https://moonbase.moonscan.io/',
    factoryAddress: '0x5e622FF522D81aa426f082bDD95210BC25fCA7Ed',
    hmtAddress: '0x2dd72db2bBA65cE663e476bA8b84A1aAF802A8e3',
    stakingAddress: '0xBFC7009F3371F93F3B54DdC8caCd02914a37495c',
    kvstoreAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbase-alpha-v1',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.AVALANCHE_TESTNET]: {
    chainId: ChainId.AVALANCHE_TESTNET,
    title: 'Fuji C-Chain',
    scanUrl: 'https://testnet.snowtrace.io',
    factoryAddress: '0xfb4469201951C3B9a7F1996c477cb7BDBEcE0A88',
    hmtAddress: '0x9406d5c635AD22b0d76c75E52De57A2177919ca3',
    stakingAddress: '',
    kvstoreAddress: '0xd232c1426CF0653cE8a71DC98bCfDf10c471c114',

    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/fuji',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    title: 'Avalanche C-Chain Mainnet',
    scanUrl: 'https://snowtrace.io',
    factoryAddress: '0x9767a578ba7a5FA1563c8229943cB01cd8446BB4',
    hmtAddress: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
    stakingAddress: '',
    kvstoreAddress: '0x4B79eaD28F52eD5686bf0e379717e85fc7aD10Df',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.SKALE]: {
    chainId: ChainId.SKALE,
    title: 'SKALE Human Protocol Chain',
    scanUrl: 'https://wan-red-ain.explorer.mainnet.skalenodes.com/',
    factoryAddress: '0x319070b49C8d1cC015915D1E7Eb5fd8e22833885',
    hmtAddress: '0x6E5FF61Ea88270F6142E0E0eC8cbe9d67476CbCd',
    stakingAddress: '0x79F37FB9C210910733c16228AC4D14a8e32C11BD',
    kvstoreAddress: '0xE1055607327b1be2080D31211dCDC4D9338CaF4A',
    subgraphUrl:
      'https://graph-skale.humanprotocol.org/subgraphs/name/skale-human',
    oldSubgraphUrl: '',
    oldFactoryAddress: '0x27B423cE73d1dBdB48d2dd351398b5Ce8223117c',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    scanUrl: '',
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    stakingAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    kvstoreAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    subgraphUrl: '',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
};
