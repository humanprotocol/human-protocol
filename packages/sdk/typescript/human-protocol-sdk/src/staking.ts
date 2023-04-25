import { Provider } from '@ethersproject/abstract-provider';
import {
  Staking__factory,
  HMToken__factory,
  HMToken,
  Staking,
  RewardPool__factory,
  RewardPool,
} from '@human-protocol/core/typechain-types';
import { BigNumber, ethers, Signer } from 'ethers';
import { NetworkData } from './types';
import { IAllocation, IClientParams, IStaker } from './interfaces';
import {
  ErrorFailedToApproveStakingAmountAllowanceNotUpdated,
  ErrorFailedToApproveStakingAmountSignerDoesNotExist,
  ErrorInvalidEthereumAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorStakingFailedToAllocate,
  ErrorStakingFailedToCloseAllocation,
  ErrorStakingFailedToSlash,
  ErrorStakingFailedToStake,
  ErrorStakingFailedToUnstake,
  ErrorStakingGetAllocation,
  ErrorStakingGetStaker,
  ErrorStakingInsufficientAllowance,
  ErrorStakingStakersNotFound,
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

  /**
   * **Approve stake for staking*
   *
   * @param {BigNumber} amount - Amount to approve
   * @returns {Promise<boolean>}
   */
  public async approveStake(amount: BigNumber): Promise<boolean> {
    try {
      if (!BigNumber.isBigNumber(amount)) {
        throw ErrorInvalidStakingValueType;
      }

      if (amount.isNegative()) {
        throw ErrorInvalidStakingValueSign;
      }

      if (await this.isAllowance(amount)) {
        return true;
      }

      await this.tokenContract.approve(this.stakingContract.address, amount);

      return true;
    } catch {
      throw ErrorFailedToApproveStakingAmountAllowanceNotUpdated;
    }
  }

  /**
   * **Stake amount*
   *
   * @param {BigNumber} amount - Amount to stake
   * @returns {Promise<void>}
   */
  public async stake(amount: BigNumber) {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    if (!(await this.isAllowance(amount))) {
      throw ErrorStakingInsufficientAllowance;
    }

    try {
      await this.stakingContract.stake(amount);
      return;
    } catch {
      throw ErrorStakingFailedToStake;
    }
  }

  /**
   * **Unstake amount*
   *
   * @param {BigNumber} amount - Amount to unstake
   * @returns {Promise<void>}
   */
  public async unstake(amount: BigNumber) {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.stakingContract.stake(amount);
      return;
    } catch {
      throw ErrorStakingFailedToUnstake;
    }
  }

  /**
   * **Withdraw amount*
   *
   * @returns {Promise<void>}
   */
  public async withdraw() {
    try {
      await this.stakingContract.withdraw();
      return;
    } catch {
      throw ErrorStakingFailedToUnstake;
    }
  }

  /**
   * **Slash amount*
   *
   * @param {string} slasher - Slasher
   * @param {string} staker - Staker
   * @param {string} escrowAddress - Escrow address
   * @param {BigNumber} amount - Amount to slash
   * @returns {Promise<void>}
   */
  public async slash(
    slasher: string,
    staker: string,
    escrowAddress: string,
    amount: BigNumber
  ): Promise<void> {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    if (
      !ethers.utils.isAddress(slasher) ||
      !ethers.utils.isAddress(staker) ||
      !ethers.utils.isAddress(escrowAddress)
    ) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      await this.stakingContract.slash(slasher, staker, escrowAddress, amount);
      return;
    } catch {
      throw ErrorStakingFailedToSlash;
    }
  }

  /**
   * **Allocate amount*
   *
   * @param {string} escrowAddress - Address of the escrow contract
   * @param {BigNumber} amount - Amount of tokens to allocate
   * @returns {Promise<void>}
   */
  public async allocate(
    escrowAddress: string,
    amount: BigNumber
  ): Promise<void> {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      await this.stakingContract.allocate(escrowAddress, amount);
      return;
    } catch {
      throw ErrorStakingFailedToAllocate;
    }
  }

  /**
   * **Close allocation*
   *
   * @param {string} escrowAddress - Address of the staker for information.
   * @returns {Promise<void>}
   */
  public async closeAllocation(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      await this.stakingContract.closeAllocation(escrowAddress);
      return;
    } catch {
      throw ErrorStakingFailedToCloseAllocation;
    }
  }

  /**
   * **Distribute rewards*
   *
   * @param {string} escrowAddress - Escrow address from which rewards are distributed
   * @returns {Promise<void>}
   */
  public async distributeRewards(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      const rewardPoolContract: RewardPool = RewardPool__factory.connect(
        await this.stakingContract.rewardPool(),
        this.signerOrProvider
      );

      await rewardPoolContract.distributeReward(escrowAddress);
      return;
    } catch {
      throw ErrorStakingFailedToUnstake;
    }
  }

  /**
   * **Get staker info*
   *
   * @param {string} staker - Address of the staker
   * @returns {Promise<IStakerInfo>}
   */
  public async getStaker(staker: string): Promise<IStaker> {
    if (!ethers.utils.isAddress(staker)) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      return this.stakingContract.getStaker(staker);
    } catch {
      throw ErrorStakingGetStaker;
    }
  }

  /**
   * **Get staker info*
   *
   * @returns {Promise<IStakerInfo>}
   */
  public async getListOfStakers(): Promise<IStaker[]> {
    try {
      const result = await this.stakingContract.getListOfStakers();

      if (result[1].length === 0) {
        throw ErrorStakingStakersNotFound;
      }

      return result[1];
    } catch {
      throw ErrorStakingGetStaker;
    }
  }

  /**
   * **Get allocation data*
   *
   * @param {string} escrowAddress - The escrow address for the received allocation data
   * @returns {Promise<IAllocation>}
   */
  public async getAllocation(escrowAddress: string): Promise<IAllocation> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEthereumAddressProvided;
    }

    try {
      return this.stakingContract.getAllocation(escrowAddress);
    } catch {
      throw ErrorStakingGetAllocation;
    }
  }

  /**
   * **Check allowance*
   *
   * @param {BigNumber} amount - Amount
   * @returns {Promise<boolean>}
   */
  public async isAllowance(amount: BigNumber): Promise<boolean> {
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
