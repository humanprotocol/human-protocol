import { Signer } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import { NetworkData } from './types';

export interface IClientParams {
  signerOrProvider: Signer | Provider;
  network: NetworkData;
}
