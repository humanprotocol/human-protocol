import { Chain } from 'wagmi';

export type EscrowNetwork = {
  chainId: number;
  title: string;
  scanUrl: string;
  rpcUrl: string;
  subgraphUrl: string;
  wagmiChain: Chain;

  hmtAddress: string;
  factoryAddress: string;
  stakingAddress: string;
  kvstoreAddress: string;

  oldSubgraphUrl: string;
  oldFactoryAddress: string;
};
