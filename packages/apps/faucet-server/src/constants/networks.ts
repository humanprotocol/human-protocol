export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
  MOONBASE_ALPHA = 1287,
  CELO = 42220,
  CELO_ALFAJORES = 44787,
  LOCALHOST = 1338,
  SKALE = 1273227453,
}

export interface IHmtNetwork {
  chainId: number;
  title: string;
  rpcUrl: string;
  hmtAddress: string;
  faucetAddress?: string;
}

export const FAUCET_NETWORKS: {
  [chainId in ChainId]?: IHmtNetwork;
} = {
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    rpcUrl: process.env.RPC_URL_GOERLI,
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
  },
  [ChainId.BSC_MAINNET]: {
    chainId: ChainId.BSC_MAINNET,
    title: 'Binance Smart Chain',
    rpcUrl: process.env.RPC_URL_BSC_MAINNET,
    hmtAddress: '0x711Fd6ab6d65A98904522d4e3586F492B989c527',
  },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    rpcUrl: process.env.RPC_URL_BSC_TESTNET,
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
  },
  [ChainId.POLYGON]: {
    chainId: ChainId.POLYGON,
    title: 'Polygon',
    rpcUrl: process.env.RPC_URL_POLYGON,
    hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    rpcUrl: process.env.RPC_URL_POLYGON_MUMBAI,
    hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: `http://127.0.0.1:${process.env.RPC_PORT}`,
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  [ChainId.MOONBEAM]: {
    chainId: ChainId.MOONBEAM,
    title: 'Moonbeam',
    rpcUrl: process.env.RPC_URL_MOONBEAM,
    hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
  },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    rpcUrl: process.env.RPC_URL_MOONBASE_ALPHA,
    hmtAddress: '0x2dd72db2bBA65cE663e476bA8b84A1aAF802A8e3',
  },
  [ChainId.CELO_ALFAJORES]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Celo Alfajores',
    rpcUrl: process.env.RPC_URL_CELO_ALFAJORES,
    hmtAddress: '0x2736B33455A872dC478E1E004106D04c35472468',
  },
  [ChainId.SKALE]: {
    chainId: ChainId.SKALE,
    title: 'SKALE Human Protocol chain',
    rpcUrl: process.env.RPC_URL_SKALE,
    hmtAddress: '0x6E5FF61Ea88270F6142E0E0eC8cbe9d67476CbCd',
    faucetAddress: '0xb51a0E538c76C82e76757dc6D5a3938136C03c0C',
  },
};
