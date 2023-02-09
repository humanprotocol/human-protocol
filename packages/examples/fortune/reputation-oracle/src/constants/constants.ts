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
  reputationAddress: string;
}

export const REPUTATION_NETWORKS: {
  [chainId in ChainId]?: IReputationNetwork;
} = {
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    reputationAddress: '0x6B220A6306D8D86C9878A1FBb3F49707b3E2b405',
  },
  // [ChainId.BSC_MAINNET]: {
  //   chainId: ChainId.BSC_MAINNET,
  //   title: 'Binance Smart Chain',
  //   scanUrl: 'https://bscscan.com',
  //   rpcUrl: 'https://bsc-dataseed1.binance.org/',
  //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
  //   reputationAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
  // },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    reputationAddress: '0xb8F62639aA3DD51A39d6AACD969363e7F87dcc98',
  },
  // [ChainId.POLYGON]: {
  //   chainId: ChainId.POLYGON,
  //   title: 'Polygon',
  //   scanUrl: 'https://polygonscan.com',
  //   rpcUrl: 'https://polygon-rpc.com/',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
  //   reputationAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
  // },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    reputationAddress: '0xC522463d36f76b881bE66484e3068F11e7038Ace',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    reputationAddress: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
  },
  // [ChainId.MOONBEAM]: {
  //   chainId: ChainId.MOONBEAM,
  //   title: 'Moonbeam',
  //   scanUrl: 'https://moonbeam.moonscan.io',
  //   rpcUrl: 'https://rpc.api.moonbeam.network',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
  //   reputationAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
  // },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    reputationAddress: '0xB0A0500103eCEc431b73F6BAd923F0a2774E6e29',
  },
};
