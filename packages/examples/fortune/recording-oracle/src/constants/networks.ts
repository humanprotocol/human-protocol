import { IEscrowNetwork } from "../interfaces/networks";

export enum ChainId {
    POLYGON = 137,
    POLYGON_MUMBAI = 80001,
    LOCALHOST = 1338
}

export const ESCROW_NETWORKS: {
    [chainId in ChainId]: IEscrowNetwork;
  } = {
    [ChainId.POLYGON]: {
        chainId: ChainId.POLYGON,
        title: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        factoryAddress: '0x15D55Cb5d9Df6273B296745C3585a94574d2fDd7',
        hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
    },
    [ChainId.POLYGON_MUMBAI]: {
      chainId: ChainId.POLYGON_MUMBAI,
      title: 'Polygon Mumbai',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      factoryAddress: '0x79aE9b3Ad106AEdc1F813AaD98f550FADd9e2254',
      hmtAddress: '0xc2B8bb720e5df43e6E13b84B27dF5543B3485EA4',
    },
    [ChainId.LOCALHOST]: {
        chainId: ChainId.LOCALHOST,
        title: 'Localhost',
        rpcUrl: 'http://127.0.0.1:8546',
        factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
        hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    }   
};