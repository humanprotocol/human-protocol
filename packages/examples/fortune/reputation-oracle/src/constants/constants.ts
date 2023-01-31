export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
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
  // [ChainId.GOERLI]: {
  //   chainId: ChainId.GOERLI,
  //   title: 'Ethereum Goerli',
  //   scanUrl: 'https://goerli.etherscan.io',
  //   rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
  //   reputationAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
  // },
  // [ChainId.BSC_MAINNET]: {
  //   chainId: ChainId.BSC_MAINNET,
  //   title: 'Binance Smart Chain',
  //   scanUrl: 'https://bscscan.com',
  //   rpcUrl: 'https://bsc-dataseed1.binance.org/',
  //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
  //   reputationAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
  // },
  // [ChainId.BSC_TESTNET]: {
  //   chainId: ChainId.BSC_TESTNET,
  //   title: 'Binance Smart Chain (Testnet)',
  //   scanUrl: 'https://testnet.bscscan.com',
  //   rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
  //   subgraphUrl:
  //     'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
  //   reputationAddress: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
  // },
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
  //   reputationAddress: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
  // },
};
