import { ChainId } from './enums';
import { NetworkData } from './types';

export const DEFAULT_PUBLIC_BUCKET = 'escrow-public-results';

export const DEFAULT_ENDPOINT = 'localhost';

export const DEFAULT_REGION = 'eu';

export const DEFAULT_PORT = 9000;

export const DEFAULT_USE_SSL = false;

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

export const NETWORKS: {
  [chainId in ChainId]?: NetworkData;
} = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    title: 'Ethereum',
    scanUrl: 'https://etherscan.io',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
    stakingAddress: '0xEf6Da3aB52c33925Be3F84038193a7e1331F51E6',
    kvstoreAddress: '0xB6d36B1CDaD50302BCB3DB43bAb0D349458e1b8D',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/ethereum/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/Qmc8ikCj9y2uvYGTeELkM9wybPdcD2PgpW4tjJMwnogLrq',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.SEPOLIA]: {
    chainId: ChainId.SEPOLIA,
    title: 'Ethereum Sepolia',
    scanUrl: 'https://sepolia.etherscan.io/',
    factoryAddress: '0x5987A5558d961ee674efe4A8c8eB7B1b5495D3bf',
    hmtAddress: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33',
    stakingAddress: '0x2163e3A40032Af1C359ac731deaB48258b317890',
    kvstoreAddress: '0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/sepolia/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmfB1oqYCMTKZB2vcYJzQmGGvVS8cMCHohpYbjKFWoFo8z',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    scanUrl: 'https://bscscan.com',
    factoryAddress: '0x92FD968AcBd521c232f5fB8c33b342923cC72714',
    hmtAddress: '0x711Fd6ab6d65A98904522d4e3586F492B989c527',
    stakingAddress: '0xE24e5C08E28331D24758b69A5E9f383D2bDD1c98',
    kvstoreAddress: '0x21A0C4CED7aE447fCf87D9FE3A29FA9B3AB20Ff1',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/bsc/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmPEaCSuzbVHDrGEWTS7T4N8U7kBMMMfkj4b4ZeqheVuMc',
    oldSubgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
    oldFactoryAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    scanUrl: 'https://testnet.bscscan.com',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
    stakingAddress: '0xD6D347ba6987519B4e42EcED43dF98eFf5465a23',
    kvstoreAddress: '0x32e27177BA6Ea91cf28dfd91a0Da9822A4b74EcF',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/bsc-testnet/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/Qmbp8jzcYurrKdk1Mg5ycJ8jcxwou3wWsmNcRdAc16aQEt',
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
    stakingAddress: '0x01D115E9E8bF0C58318793624CC662a030D07F1D',
    kvstoreAddress: '0xbcB28672F826a50B03EE91B28145EAbddA73B2eD',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/polygon/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmeSoEuFieiKXtqzDY3WUBz5gKFWwYVPP7iaebpBpJyo7Y',
    oldSubgraphUrl:
      'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    oldFactoryAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
  },
  [ChainId.POLYGON_AMOY]: {
    chainId: ChainId.POLYGON_AMOY,
    title: 'Polygon Amoy',
    scanUrl: 'https://amoy.polygonscan.com/',
    factoryAddress: '0xAFf5a986A530ff839d49325A5dF69F96627E8D29',
    hmtAddress: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33',
    stakingAddress: '0xffE496683F842a923110415b7278ded3F265f2C5',
    kvstoreAddress: '0x724AeFC243EdacCA27EAB86D3ec5a76Af4436Fc7',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/74256/amoy/version/latest',
    subgraphUrlApiKey:
      'https://gateway-arbitrum.network.thegraph.com/api/[SUBGRAPH_API_KEY]/deployments/id/QmQUUv8SK2skarDrJpB8LXXqMwjzxg3Z42dx12uEL5Pmeq',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    scanUrl: '',
    factoryAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    stakingAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    kvstoreAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    subgraphUrl: 'http://localhost:8000/subgraphs/name/humanprotocol/localhost',
    subgraphUrlApiKey: '',
    oldSubgraphUrl: '',
    oldFactoryAddress: '',
  },
};

export const KVStoreKeys = {
  role: 'role',
  fee: 'fee',
  publicKey: 'public_key',
  publicKeyHash: 'public_key_hash',
  webhookUrl: 'webhook_url',
  website: 'website',
  url: 'url',
  jobTypes: 'job_types',
  registrationNeeded: 'registration_needed',
  registrationInstructions: 'registration_instructions',
  name: 'name',
  category: 'category',
};

export const Role = {
  JobLauncher: 'job_launcher',
  ExchangeOracle: 'exchange_oracle',
  ReputationOracle: 'reputation_oracle',
  RecordingOracle: 'recording_oracle',
};

export const SUBGRAPH_API_KEY_PLACEHOLDER = '[SUBGRAPH_API_KEY]';

export const ESCROW_BULK_PAYOUT_MAX_ITEMS = 99;
