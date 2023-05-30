import { IEscrowNetwork } from '../interfaces/networks';

export enum ChainId {
  MAINNET = 1,
  GOERLI = 5,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBASE_ALPHA = 1287,
  LOCALHOST = 1338,
  SKALE = 1273227453,
}

export const ESCROW_NETWORKS: {
  [chainId in ChainId]?: IEscrowNetwork;
} = {
  [ChainId.MAINNET]: {
    chainId: ChainId.MAINNET,
    title: 'Ethereum',
    rpcUrl:
      'https://eth-mainnet.g.alchemy.com/v2/VVDrD3TpJv8ZBP4CiwH2m5Oj6r0hM2st',
    factoryAddress: '0xD9c75a1Aa4237BB72a41E5E26bd8384f10c1f55a',
    hmtAddress: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
  },
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
  },
  // [ChainId.POLYGON]: {
  //   chainId: ChainId.POLYGON,
  //   title: 'Polygon',
  //   rpcUrl: 'https://polygon-rpc.com',
  //   factoryAddress: '0x15D55Cb5d9Df6273B296745C3585a94574d2fDd7',
  //   hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
  // },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    factoryAddress: '0x79aE9b3Ad106AEdc1F813AaD98f550FADd9e2254',
    hmtAddress: '0xc2B8bb720e5df43e6E13b84B27dF5543B3485EA4',
  },
  [ChainId.MOONBASE_ALPHA]: {
    chainId: ChainId.MOONBASE_ALPHA,
    title: 'Moonbase Alpha',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
    factoryAddress: '0x5e622FF522D81aa426f082bDD95210BC25fCA7Ed',
    hmtAddress: '0x2dd72db2bBA65cE663e476bA8b84A1aAF802A8e3',
  },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: `http://127.0.0.1:${process.env.RPC_PORT}`,
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  // [ChainId.SKALE]: {
  //   chainId: ChainId.SKALE,
  //   title: 'SKALE Human Protocol chain',
  //   rpcUrl: 'https://mainnet.skalenodes.com/v1/wan-red-ain',
  //   factoryAddress: '0x319070b49C8d1cC015915D1E7Eb5fd8e22833885',
  //   hmtAddress: '0x6E5FF61Ea88270F6142E0E0eC8cbe9d67476CbCd',
  // },
};
