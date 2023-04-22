import { Provider } from '@ethersproject/abstract-provider';
import {
  Staking__factory,
  HMToken__factory,
  HMToken,
  Staking,
} from '@human-protocol/core/typechain-types';
import { Signer } from 'ethers';
import { NetworkData } from './types';
import { IClientParams } from './interfaces';

export class StakingClient {
  private readonly signerOrProvider: Signer | Provider;
  private readonly network: NetworkData;
  private readonly tokenContract: HMToken;
  private readonly stakingContract: Staking;

  /**
   * **Staking constructor**
   *
   * @param {IClientParams} clientParams - Init client parameters
   */
  constructor(readonly clientParams: IClientParams) {
    this.signerOrProvider = clientParams.signerOrProvider;
    this.network = clientParams.network;

    this.stakingContract = Staking__factory.connect(
      this.network.stakingAddress,
      this.signerOrProvider
    );

    this.tokenContract = HMToken__factory.connect(
      this.network.hmtAddress,
      this.signerOrProvider
    );
  }
}
