export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
  MOONBASE_ALPHA = 1287,
  LOCALHOST = 1338,
}

export interface IReputationNetwork {
  chainId: number;
  title: string;
  rpcUrl: string;
}

export const REPUTATION_NETWORKS: {
  [chainId in ChainId]?: IReputationNetwork;
} = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    title: 'Ethereum',
    rpcUrl:
      'https://eth-mainnet.g.alchemy.com/v2/VVDrD3TpJv8ZBP4CiwH2m5Oj6r0hM2st',
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  },
  // [ChainId.BSC_MAINNET]: {
  //   chainId: ChainId.BSC_MAINNET,
  //   title: 'Binance Smart Chain',
  //   scanUrl: 'https://bscscan.com',
  //   rpcUrl: 'https://bsc-dataseed1.binance.org/',
  //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
  // },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
  },
  // [ChainId.POLYGON]: {
  //   chainId: ChainId.POLYGON,
  //   title: 'Polygon',
  //   scanUrl: 'https://polygonscan.com',
  //   rpcUrl: 'https://polygon-rpc.com/',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
  // },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
  },
  // [ChainId.MOONBEAM]: {
  //   chainId: ChainId.MOONBEAM,
  //   title: 'Moonbeam',
  //   scanUrl: 'https://moonbeam.moonscan.io',
  //   rpcUrl: 'https://rpc.api.moonbeam.network',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
  // },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  },
};
