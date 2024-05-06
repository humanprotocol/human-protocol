export interface ContractsAddresses {
  HMToken: string;
  Staking: string;
}

export type Testnet = 'Amoy' | 'EthereumGoerli';
export type Mainnet = 'Polygon' | 'Ethereum';
// TODO import addresses from envs, this step may be optional

export const TestnetContracts: Record<Testnet, ContractsAddresses> = {
  Amoy: {
    Staking: '0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60',
    // HMToken: '0x4a6935564A774140f443f9cEd3dd9d2D7Ec878Df', // copy for development
    HMToken: '0x792abbcC99c01dbDec49c9fa9A828a186Da45C33', // address from docs that works
  },
  EthereumGoerli: {
    Staking: '0xe0Ccc2f17b72F9A1e23f0C8dD5DDfB7484b54aB3',
    HMToken: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
  },
};

export const MainnetContracts: Record<Mainnet, ContractsAddresses> = {
  Polygon: {
    Staking: '0x3eB07971307fABa34A9386F64cBa18a3Fe90290a',
    HMToken: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
  },
  Ethereum: {
    Staking: '0x37Fd69b4C8f71C8C2BC5650cebd27C2Cda6F6256',
    HMToken: '0xd1ba9BAC957322D6e8c07a160a3A8dA11A0d2867',
  },
};
