import { Provider } from '@ethersproject/abstract-provider';
import {
  Staking__factory,
  HMToken__factory,
  HMToken,
  Staking,
  RewardPool__factory,
  RewardPool,
  EscrowFactory,
  EscrowFactory__factory,
} from '@human-protocol/core/typechain-types';
import { BigNumber, ethers, Signer } from 'ethers';
import { NetworkData } from './types';
import { IAllocation, IClientParams, IReward, IStaker } from './interfaces';
import {
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorStakingGetStakers,
} from './error';
import { gqlFetch, throwError, toBigNumber } from './utils';
import { RAW_REWARDS_QUERY } from './queries';

export default class StakingClient {
  public signerOrProvider: Signer | Provider;
  public network: NetworkData;
  public tokenContract: HMToken;
  public stakingContract: Staking;
  public escrowFactoryContract: EscrowFactory;

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

    this.escrowFactoryContract = EscrowFactory__factory.connect(
      this.network.factoryAddress,
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
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred, void otherwise
   */
  public async approveStake(amount: BigNumber): Promise<void> {
    if (!BigNumber.isBigNumber(amount)) {
      throw ErrorInvalidStakingValueType;
    }

    if (amount.isNegative()) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.tokenContract.approve(this.stakingContract.address, amount);
      return;
    } catch (e) {
      return throwError(e);
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

    try {
      await this.stakingContract.stake(amount);
      return;
    } catch (e) {
      return throwError(e);
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
    } catch (e) {
      return throwError(e);
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
    } catch (e) {
      return throwError(e);
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      await this.stakingContract.slash(slasher, staker, escrowAddress, amount);

      return;
    } catch (e) {
      return throwError(e);
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      await this.stakingContract.allocate(escrowAddress, amount);
      return;
    } catch (e) {
      return throwError(e);
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      await this.stakingContract.closeAllocation(escrowAddress);
      return;
    } catch (e) {
      return throwError(e);
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const rewardPoolContract: RewardPool = RewardPool__factory.connect(
        await this.stakingContract.rewardPool(),
        this.signerOrProvider
      );

      await rewardPoolContract.distributeReward(escrowAddress);
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * **Returns the staking information about an staker address.*
   *
   * @param {string} staker - Address of the staker
   * @returns {Promise<IStaker>} - Return staking information of the specified address
   * @throws {Error} - An error object if an error occurred, result otherwise
   */
  public async getStaker(staker: string): Promise<IStaker> {
    if (!ethers.utils.isAddress(staker)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const result = await this.stakingContract.getStaker(staker);

      const tokensStaked = toBigNumber(result.tokensStaked),
        tokensAllocated = toBigNumber(result.tokensAllocated),
        tokensLocked = toBigNumber(result.tokensLocked),
        tokensLockedUntil = toBigNumber(result.tokensLockedUntil);

      const tokensAvailable = tokensStaked
        .sub(tokensAllocated)
        .sub(tokensLocked);

      return {
        tokensStaked,
        tokensAllocated,
        tokensLocked,
        tokensLockedUntil,
        tokensAvailable,
      };
    } catch (e) {
      return throwError(e);
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
        throw ErrorStakingGetStakers;
      }

      return result[1].map((staker: any) => {
        const tokensStaked = toBigNumber(staker.tokensStaked),
          tokensAllocated = toBigNumber(staker.tokensAllocated),
          tokensLocked = toBigNumber(staker.tokensLocked),
          tokensLockedUntil = toBigNumber(staker.tokensLockedUntil);

        const tokensAvailable = tokensStaked
          .sub(tokensAllocated)
          .sub(tokensLocked);

        return {
          tokensStaked,
          tokensAllocated,
          tokensLocked,
          tokensLockedUntil,
          tokensAvailable,
        };
      });
    } catch (e) {
      return throwError(e);
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

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }

    try {
      const result = await this.stakingContract.getAllocation(escrowAddress);
      return result;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * **Returns information about the rewards for a given escrow address.*
   *
   * @param {string} slasherAddress - Address of the slasher
   * @returns {Promise<IReward[]>} - Returns rewards info if exists
   * @throws {Error} - An error object if an error occurred, results otherwise
   */
  public async getRewards(slasherAddress: string): Promise<IReward[]> {
    if (!ethers.utils.isAddress(slasherAddress)) {
      throw ErrorInvalidSlasherAddressProvided;
    }

    try {
      const { data } = await gqlFetch(
        this.network.subgraphUrl,
        RAW_REWARDS_QUERY(slasherAddress)
      );

      return data.rewardAddedEvents.map((reward: any) => {
        return {
          escrowAddress: reward.escrow,
          amount: reward.amount,
        };
      });
    } catch (e) {
      return throwError(e);
    }
  }
}
