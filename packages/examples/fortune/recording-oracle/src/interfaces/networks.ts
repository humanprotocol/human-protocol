import Web3 from "web3";

export interface IEscrowNetwork {
    chainId: number;
    title: string;
    rpcUrl: string;
    factoryAddress: string;
    hmtAddress: string;
}

export interface IWeb3MultiNetwork {
    [chainId: number]: Web3
  }