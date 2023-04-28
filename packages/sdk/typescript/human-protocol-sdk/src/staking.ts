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
import { IAllocation, IClientParams, IReward, IStaker } from './interfaces';
import {
  ErrorFailedToApproveStakingAmountAllowanceNotUpdated,
  ErrorFailedToApproveStakingAmountSignerDoesNotExist,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorStakingFailedToAllocate,
  ErrorStakingFailedToCloseAllocation,
  ErrorStakingFailedToDistributeRewards,
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
   * **Approves the staking contract to transfer a specified amount of tokens when the user stakes.
   * **It increases the allowance for the staking contract.*
   *
   * @param {BigNumber} amount - Amount of tokens to approve for stake
   * @returns {Promise<boolean>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async approveStake(amount: BigNumber): Promise<void> {
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
      await this.tokenContract.approve(this.stakingContract.address, amount);
      return;
    } catch (e) {
      throw ErrorFailedToApproveStakingAmountAllowanceNotUpdated;
    }
  }

  /**
   * **Stakes a specified amount of tokens on a specific network.*
   *
   * @param {BigNumber} amount - Amount of tokens to stake
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async stake(amount: BigNumber): Promise<void> {
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
   * **Unstakes tokens from staking contract.
   * **The unstaked tokens stay locked for a period of time.*
   *
   * @param {BigNumber} amount - Amount of tokens to unstake
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async unstake(amount: BigNumber): Promise<void> {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.stakingContract.unstake(amount);
      return;
    } catch {
      throw ErrorStakingFailedToUnstake;
    }
  }

  /**
   * **Withdraws unstaked and non locked tokens form staking contract to the user wallet.*
   *
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async withdraw(): Promise<void> {
    try {
      await this.stakingContract.withdraw();
      return;
    } catch {
      throw ErrorStakingFailedToUnstake;
    }
  }

  /**
   * **Slash the allocated amount by an staker in an escrow and transfers those tokens to the reward pool.
   * **This allows the slasher to claim them later.*
   *
   * @param {string} slasher - Wallet address from who requested the slash
   * @param {string} staker - Wallet address from who is going to be slashed
   * @param {string} escrowAddress - Address of the escrow which allocation will be slashed
   * @param {BigNumber} amount - Amount of tokens to slash
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
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

    if (!ethers.utils.isAddress(slasher)) {
      throw ErrorInvalidSlasherAddressProvided;
    }

    if (!ethers.utils.isAddress(staker)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      await this.stakingContract.slash(slasher, staker, escrowAddress, amount);
      return;
    } catch {
      throw ErrorStakingFailedToSlash;
    }
  }

  /**
   * **Allocates a portion of the staked tokens to a specific escrow.*
   *
   * @param {string} escrowAddress - Address of the escrow contract
   * @param {BigNumber} amount - Amount of tokens to allocate
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
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
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      await this.stakingContract.allocate(escrowAddress, amount);
      return;
    } catch {
      throw ErrorStakingFailedToAllocate;
    }
  }

  /**
   * **Drops the allocation from a specific escrow.*
   *
   * @param {string} escrowAddress - Address of the escrow contract.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async closeAllocation(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      await this.stakingContract.closeAllocation(escrowAddress);
      return;
    } catch {
      throw ErrorStakingFailedToCloseAllocation;
    }
  }

  /**
   * **Pays out rewards to the slashers for the specified escrow address.*
   *
   * @param {string} escrowAddress - Escrow address from which rewards are distributed.
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async distributeRewards(escrowAddress: string): Promise<void> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      const rewardPoolContract: RewardPool = RewardPool__factory.connect(
        await this.stakingContract.rewardPool(),
        this.signerOrProvider
      );

      await rewardPoolContract.distributeReward(escrowAddress);
      return;
    } catch (e) {
      throw ErrorStakingFailedToDistributeRewards;
    }
  }

  /**
   * **Returns the staking information about an staker address.*
   *
   * @param {string} staker - Address of the staker
   * @returns {Promise<IStakerInfo>} - Return staking information of the specified address
   * @throws {Error} - An error object if an error occurred, result otherwise
   */
  public async getStaker(staker: string): Promise<IStaker> {
    if (!ethers.utils.isAddress(staker)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const result = await this.stakingContract.getStaker(staker);
      return result;
    } catch {
      throw ErrorStakingGetStaker;
    }
  }

  /**
   * **Returns the staking information about all stakers of the protocol.*
   *
   * @returns {Promise<IStakerInfo>} - Return an array with all stakers information
   * @throws {Error} - An error object if an error occurred, results otherwise
   */
  public async getAllStakers(): Promise<IStaker[]> {
    try {
      const result = await this.stakingContract.getListOfStakers();

      if (result[1].length === 0) {
        throw ErrorStakingStakersNotFound;
      }

      return result[1];
    } catch {
      throw ErrorStakingStakersNotFound;
    }
  }

  /**
   * **Returns information about the allocation of the specified escrow.*
   *
   * @param {string} escrowAddress - The escrow address for the received allocation data
   * @returns {Promise<IAllocation>} - Returns allocation info if exists
   * @throws {Error} - An error object if an error occurred, result otherwise
   */
  public async getAllocation(escrowAddress: string): Promise<IAllocation> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      const result = await this.stakingContract.getAllocation(escrowAddress);
      return result;
    } catch {
      throw ErrorStakingGetAllocation;
    }
  }

  /**
   * **Returns information about the rewards for a given escrow address.*
   *
   * @param {string} escrowAddress - Address of the escrow
   * @returns {Promise<IReward[]>} - Returns rewards info if exists
   * @throws {Error} - An error object if an error occurred, results otherwise
   */
  public async getRewards(escrowAddress: string): Promise<IReward[]> {
    if (!ethers.utils.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    try {
      const rewardPoolContract: RewardPool = RewardPool__factory.connect(
        await this.stakingContract.rewardPool(),
        this.signerOrProvider
      );

      return rewardPoolContract.getRewards(escrowAddress);
    } catch {
      throw ErrorStakingGetAllocation;
    }
  }

  /**
   * **Check allowance*
   *
   * @param {BigNumber} amount - Amount of the tokens
   * @returns {Promise<boolean>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  private async isAllowance(amount: BigNumber): Promise<boolean> {
    if (this.signerOrProvider instanceof Provider) {
      throw ErrorFailedToApproveStakingAmountSignerDoesNotExist;
    }

    const newAllowance = await this.tokenContract.allowance(
      await this.signerOrProvider.getAddress(),
      this.stakingContract.address
    );

    return newAllowance.gte(amount);
  }
}
