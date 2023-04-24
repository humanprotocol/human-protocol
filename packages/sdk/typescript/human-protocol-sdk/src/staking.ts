import { Provider } from '@ethersproject/abstract-provider';
import {
  Staking__factory,
  HMToken__factory,
  HMToken,
  Staking,
} from '@human-protocol/core/typechain-types';
import { BigNumber, Signer } from 'ethers';
import { NetworkData } from './types';
import { IClientParams } from './interfaces';
import {
  ErrorFailedToApproveStakingAmountAllowanceNotUpdated,
  ErrorFailedToApproveStakingAmountSignerDoesNotExist,
  ErrorHMTokenAmountNotApproved,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorStakingValueMustBePositive,
  ErrorStakingValueNotBigNumber,
} from './error';

export default class StakingClient {
  public signerOrProvider: Signer | Provider;
  public network: NetworkData;
  public tokenContract: HMToken;
  public stakingContract: Staking;

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

  public async approveStake(amount: BigNumber): Promise<boolean> {
    try {
      console.log(12321, amount);
      if (!BigNumber.isBigNumber(amount)) {
        throw ErrorInvalidStakingValueType;
      }

      if (amount.isNegative()) {
        throw ErrorInvalidStakingValueSign;
      }

      if (await this.isAllowance(amount)) {
        return true;
      }

      const tx = await this.tokenContract.approve(
        this.stakingContract.address,
        amount
      );

      await tx.wait();

      return this.isAllowance(amount);
    } catch (error) {
      throw ErrorFailedToApproveStakingAmountAllowanceNotUpdated;
    }
  }

  private async isAllowance(amount: BigNumber): Promise<boolean> {
    if (this.signerOrProvider instanceof Signer) {
      const newAllowance = await this.tokenContract.allowance(
        await this.signerOrProvider.getAddress(),
        this.stakingContract.address
      );

      return newAllowance.gte(amount);
    } else {
      throw ErrorFailedToApproveStakingAmountSignerDoesNotExist;
    }
  }
}
