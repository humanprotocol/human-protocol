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
 * @constant Default storage region
 */
export const DEFAULT_REGION = 'eu';

/**
 * @constant Default storage port
 */
export const DEFAULT_PORT = 9000;

/**
 * @constant Default storage port
 */
export const DEFAULT_USE_SSL = false;

/**
 * @constant Default tx Id
 */
export const DEFAULT_TX_ID = 1;

/**
 * @constant Default Enum for escrow statuses.
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

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
    rewardPoolAddress: '0x4A5963Dd6792692e9147EdC7659936b96251917a',
    kvstoreAddress: '0xB6d36B1CDaD50302BCB3DB43bAb0D349458e1b8D',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mainnet-v2',
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
    rewardPoolAddress: '',
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
    rewardPoolAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
    kvstoreAddress: '0x19Fc3e859C1813ac9427a7a78BeB9ae102CE96d3',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli-v2',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    oldFactoryAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
  },
  [ChainId.SEPOLIA]: {
    chainId: ChainId.SEPOLIA,
    title: 'Ethereum Sepolia',
    scanUrl: 'https://sepolia.etherscan.io/',
    factoryAddress: '0xD6D347ba6987519B4e42EcED43dF98eFf5465a23',
    hmtAddress: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33',
    stakingAddress: '0x2B9C5EC6220BA8Ad08CB51A60FFdbC6a6235B203',
    rewardPoolAddress: '0xAFf5a986A530ff839d49325A5dF69F96627E8D29',
    kvstoreAddress: '0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60',
    subgraphUrl:
      'https://subgraph.satsuma-prod.com/8d51f9873a51/team--2543/humanprotocol-sepolia/api',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    scanUrl: 'https://bscscan.com',
    factoryAddress: '0x92FD968AcBd521c232f5fB8c33b342923cC72714',
    hmtAddress: '0x711Fd6ab6d65A98904522d4e3586F492B989c527',
    stakingAddress: '0xdFbB79dC35a3A53741be54a2C9b587d6BafAbd1C',
    rewardPoolAddress: '0xf376443BCc6d4d4D63eeC086bc4A9E4a83878e0e',
    kvstoreAddress: '0x21A0C4CED7aE447fCf87D9FE3A29FA9B3AB20Ff1',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc-v2',
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
    rewardPoolAddress: '0xB0A0500103eCEc431b73F6BAd923F0a2774E6e29',
    kvstoreAddress: '0x32e27177BA6Ea91cf28dfd91a0Da9822A4b74EcF',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest-v2',
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
    rewardPoolAddress: '0xa8e32d777a3839440cc7c24D591A64B9481753B3',
    kvstoreAddress: '0xbcB28672F826a50B03EE91B28145EAbddA73B2eD',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon-v2',
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
    rewardPoolAddress: '0xf0145eD99AC3c4f877aDa7dA4D1E059ec9116BAE',
    kvstoreAddress: '0xD96158c7267Ea658a4688F4aEf1c85659851625d',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v2',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai',
    oldFactoryAddress: '0x558cd800f9F0B02f3B149667bDe003284c867E94',
  },
  [ChainId.POLYGON_AMOY]: {
    chainId: ChainId.POLYGON_AMOY,
    title: 'Polygon Amoy',
    scanUrl: 'https://www.oklink.com/amoy',
    factoryAddress: '0xAFf5a986A530ff839d49325A5dF69F96627E8D29',
    hmtAddress: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33',
    stakingAddress: '0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60',
    rewardPoolAddress: '0xd866bCEFf6D0F77E1c3EAE28230AE6C79b03fDa7',
    kvstoreAddress: '0x724AeFC243EdacCA27EAB86D3ec5a76Af4436Fc7',
    subgraphUrl:
      'https://subgraph.satsuma-prod.com/8d51f9873a51/team--2543/humanprotocol-amoy/api',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.MOONBEAM]: {
    chainId: ChainId.MOONBEAM,
    title: 'Moonbeam',
    scanUrl: 'https://moonbeam.moonscan.io',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
    stakingAddress: '0x05398211bA2046E296fBc9a9D3EB49e3F15C3123',
    rewardPoolAddress: '0x4A5963Dd6792692e9147EdC7659936b96251917a',
    kvstoreAddress: '0x2B95bEcb6EBC4589f64CB000dFCF716b4aeF8aA6',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam-v2',
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
    rewardPoolAddress: '0xf46B45Df3d956369726d8Bd93Ba33963Ab692920',
    kvstoreAddress: '0xcC561f4482f4Ff051D2Dcc65c2cE1A0f291bbA46',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbase-alpha-v2',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.AVALANCHE_TESTNET]: {
    chainId: ChainId.AVALANCHE_TESTNET,
    title: 'Fuji C-Chain',
    scanUrl: 'https://testnet.snowtrace.io',
    factoryAddress: '0x56C2ba540726ED4f46E7a134b6b9Ee9C867FcF92',
    hmtAddress: '0x9406d5c635AD22b0d76c75E52De57A2177919ca3',
    stakingAddress: '0x9890473B0b93E24d6D1a8Dfb739D577C6f25FFd3',
    rewardPoolAddress: '0x5517fE916Fe9F8dB15B0DDc76ebDf0BdDCd4ed18',
    kvstoreAddress: '0x3aD4B091E054f192a822D1406f4535eAd38580e4',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/fuji-v2',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/fuji',
    oldFactoryAddress: '0xfb4469201951C3B9a7F1996c477cb7BDBEcE0A88',
  },
  [ChainId.AVALANCHE]: {
    chainId: ChainId.AVALANCHE,
    title: 'Avalanche C-Chain Mainnet',
    scanUrl: 'https://snowtrace.io',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0x12365293cb6477d4fc2686e46BB97E3Fb64f1550',
    stakingAddress: '0x05398211bA2046E296fBc9a9D3EB49e3F15C3123',
    rewardPoolAddress: '0x4A5963Dd6792692e9147EdC7659936b96251917a',
    kvstoreAddress: '0x9Bc7bff35B2Be2413708d48c3B0aEF5c43646728',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche-v2',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/avalanche',
    oldFactoryAddress: '0x9767a578ba7a5FA1563c8229943cB01cd8446BB4',
  },
  [ChainId.CELO_ALFAJORES]: {
    chainId: ChainId.CELO_ALFAJORES,
    title: 'Celo Alfajores',
    scanUrl: 'https://alfajores.celoscan.io/',
    factoryAddress: '0x86Af9f6Cd34B69Db1B202223C6d6D109f2491569',
    hmtAddress: '0x2736B33455A872dC478E1E004106D04c35472468',
    stakingAddress: '0x003548Df34be8836cF0F9673403a1E40ba449a0F',
    rewardPoolAddress: '0xA9545C2530BD5bdb464d5E274F59ACceAa73eD86',
    kvstoreAddress: '0x938335006ea6F9Eb0e8020969cFF94404425e298',
    subgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/celo-alfajores',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.CELO]: {
    chainId: ChainId.CELO,
    title: 'Celo',
    scanUrl: 'https://celoscan.io/',
    factoryAddress: '0xc90B43a5d576D9d8026c48904dfbaED50C15Fa08',
    hmtAddress: '0x19Ead835951493A763c96910255d5eeF147E914F',
    stakingAddress: '0x34cD3Bd6B16c559f321799b516dE61E12017fFd1',
    rewardPoolAddress: '0xb9344bAD98E3d26a4d83900922baf395a2Ec154c',
    kvstoreAddress: '0x86Af9f6Cd34B69Db1B202223C6d6D109f2491569',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/celo',
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
    rewardPoolAddress: '0x881218246c25C6898aE96145259584340153aDA2',
    kvstoreAddress: '0xE1055607327b1be2080D31211dCDC4D9338CaF4A',
    subgraphUrl:
      'https://graph-skale.humanprotocol.org/subgraphs/name/skale-human',
    oldSubgraphUrl: '',
    oldFactoryAddress: '0x27B423cE73d1dBdB48d2dd351398b5Ce8223117c',
  },
  [ChainId.XLAYER]: {
    chainId: ChainId.XLAYER,
    title: 'XLayer',
    scanUrl: 'https://www.oklink.com/xlayer',
    factoryAddress: '0x4949C9DFFD83F0D5Ab0AB24C57C4D403D5c20C15',
    hmtAddress: '0x10acbe3b9e6a2ff7f341e5cbf4b6617741ff44aa',
    stakingAddress: '0x01D115E9E8bF0C58318793624CC662a030D07F1D',
    rewardPoolAddress: '0x7ABa5F75b2b530cB0c8927C86591c21dF44f06b6',
    kvstoreAddress: '0x6512d894cc3d3FE93Da9d0420430136fA889FaB9',
    subgraphUrl:
      'https://gateway-arbitrum.network.thegraph.com/api/b376e45c321d3fcd7d659f9532f0a464/subgraphs/id/CrratkbjCraj1BZLgJmck1GGxbMb2Y2iPZiW4Lh5DdcX',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.XLAYER_TESTNET]: {
    chainId: ChainId.XLAYER_TESTNET,
    title: 'XLayer Testnet',
    scanUrl: 'https://www.okx.com/explorer/xlayer-test',
    factoryAddress: '0x6Cd3ecAD36ee88E9ef3665CF381D9dAE0FE0a32e',
    hmtAddress: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33',
    stakingAddress: '0x819069fEd50581587fAB9E583b5488fc2D33B7ea',
    rewardPoolAddress: '0x6daccd1f3a68945f8a7ac6d20260953f7a97fae4',
    kvstoreAddress: '0xdE8BE9E3C12E9F546309A429cd88d026a25EaF8C',
    subgraphUrl:
      'https://gateway-arbitrum.network.thegraph.com/api/b376e45c321d3fcd7d659f9532f0a464/subgraphs/id/EX5DU7VEVmkfNCzUG1gRRy8hBKtknA868NR2kSTF4D93',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    scanUrl: '',
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    stakingAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    rewardPoolAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    kvstoreAddress: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    subgraphUrl: 'http://localhost:8000/subgraphs/name/humanprotocol/localhost',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
};

export const KVStoreKeys = {
  role: 'role',
  fee: 'fee',
  publicKey: 'public_key',
  webhookUrl: 'webhook_url',
  url: 'url',
  jobTypes: 'job_types',
};

export const Role = {
  JobLauncher: 'Job Launcher',
  ExchangeOracle: 'Exchange Oracle',
  ReputationOracle: 'Reputation Oracle',
  RecordingOracle: 'Recording Oracle',
};
