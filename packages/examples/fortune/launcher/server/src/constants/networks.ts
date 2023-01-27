export enum ChainId {
    ALL = -1,
    MAINNET = 1,
    GOERLI = 5,
    BSC_MAINNET = 56,
    BSC_TESTNET = 97,
    POLYGON = 137,
    POLYGON_MUMBAI = 80001,
  MOONBEAM = 1284,
    LOCALHOST = 1338
  }
  
  export interface IEscrowNetwork {
    chainId: number;
    title: string;
    rpcUrl: string;
    hmtAddress: string;
    factoryAddress: string;
  }


export const ESCROW_NETWORKS: {
    [chainId in ChainId]?: IEscrowNetwork;
  } = {
    // [ChainId.GOERLI]: {
    //   chainId: ChainId.GOERLI,
    //   title: 'Ethereum Goerli',
    //   scanUrl: 'https://goerli.etherscan.io',
    //   rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/goerli',
    //   factoryAddress: '0xaAe6a2646C1F88763E62e0cD08aD050Ea66AC46F',
    //   hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
    // },
    // [ChainId.BSC_MAINNET]: {
    //   chainId: ChainId.BSC_MAINNET,
    //   title: 'Binance Smart Chain',
    //   scanUrl: 'https://bscscan.com',
    //   rpcUrl: 'https://bsc-dataseed1.binance.org/',
    //   subgraphUrl: 'https://api.thegraph.com/subgraphs/name/humanprotocol/bsc',
    //   factoryAddress: '0xc88bC422cAAb2ac8812de03176402dbcA09533f4',
    //   hmtAddress: '0x0d501B743F22b641B8C8dfe00F1AAb881D57DDC7',
    // },
    // [ChainId.BSC_TESTNET]: {
    //   chainId: ChainId.BSC_TESTNET,
    //   title: 'Binance Smart Chain (Testnet)',
    //   scanUrl: 'https://testnet.bscscan.com',
    //   rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    //   subgraphUrl:
    //     'https://api.thegraph.com/subgraphs/name/humanprotocol/bsctest',
    //   factoryAddress: '0xaae6a2646c1f88763e62e0cd08ad050ea66ac46f',
    //   hmtAddress: '0xd3a31d57fdd790725d0f6b78095f62e8cd4ab317',
    // },
    // [ChainId.POLYGON]: {
    //   chainId: ChainId.POLYGON,
    //   title: 'Polygon',
    //   scanUrl: 'https://polygonscan.com',
    //   rpcUrl: 'https://polygon-rpc.com/',
    //   subgraphUrl:
    //     'https://api.thegraph.com/subgraphs/name/humanprotocol/polygon',
    //   factoryAddress: '0x45eBc3eAE6DA485097054ae10BA1A0f8e8c7f794',
    //   hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
    // },
    [ChainId.POLYGON_MUMBAI]: {
      chainId: ChainId.POLYGON_MUMBAI,
      title: 'Polygon Mumbai',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      factoryAddress: '0xA8D927C4DA17A6b71675d2D49dFda4E9eBE58f2d',
      hmtAddress: '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8546',
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  }
    // [ChainId.MOONBEAM]: {
    //   chainId: ChainId.MOONBEAM,
    //   title: 'Moonbeam',
    //   scanUrl: 'https://moonbeam.moonscan.io',
    //   rpcUrl: 'https://rpc.api.moonbeam.network',
    //   subgraphUrl:
    //     'https://api.thegraph.com/subgraphs/name/humanprotocol/moonbeam',
    //   factoryAddress: '0x98108c28B7767a52BE38B4860832dd4e11A7ecad',
    //   hmtAddress: '0x3b25BC1dC591D24d60560d0135D6750A561D4764',
    // },
  };