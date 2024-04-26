export interface ContractsAddresses {
  HMToken?: string;
  EscrowFactory?: string;
  Staking: string;
  RewardPool?: string;
  EthKVStore?: string;
}
// TODO import addresses from envs, this step may be optional
export const TestnetContracts = {
  Amoy: {
    Staking: '0xCc0AF0635aa19fE799B6aFDBe28fcFAeA7f00a60',
  },
  EthereumGoerli: {
    Staking: '0xe0Ccc2f17b72F9A1e23f0C8dD5DDfB7484b54aB3',
  },
} as const;

export const MainnetContracts = {
  Polygon: {
    Staking: '0x3eB07971307fABa34A9386F64cBa18a3Fe90290a',
  },
  Ethereum: {
    Staking: '0x37Fd69b4C8f71C8C2BC5650cebd27C2Cda6F6256',
  },
} as const;
