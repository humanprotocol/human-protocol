/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  EscrowFactory,
  EscrowFactory__factory,
  HMToken,
  HMToken__factory,
  RewardPool,
  RewardPool__factory,
  Staking,
  Staking__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, Overrides, ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { BaseEthersClient } from './base';
import { NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId } from './enums';
import {
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorProviderDoesNotExist,
  ErrorUnsupportedChainID,
} from './error';
import { IAllocation, ILeader, ILeadersFilter, IReward } from './interfaces';
import { NetworkData } from './types';
import { throwError } from './utils';
import { GET_REWARD_ADDED_EVENTS_QUERY } from './graphql/queries/reward';
import { RewardAddedEventData } from './graphql';
import { GET_LEADER_QUERY, GET_LEADERS_QUERY } from './graphql/queries/staking';

/**
 * ## Introduction
 *
 * This client enables to perform actions on staking contracts and obtain staking information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner);
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
 * - **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ### Signer
 *
 * **Using private key(backend)**
 *
 * ```ts
 * import { StakingClient } from '@human-protocol/sdk';
 * import { Wallet, providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY'
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const stakingClient = await StakingClient.build(signer);
 * ```
 *
 * **Using Wagmi(frontend)**
 *
 * ```ts
 * import { useSigner, useChainId } from 'wagmi';
 * import { StakingClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const stakingClient = await StakingClient.build(signer);
 * ```
 *
 * ### Provider
 *
 * ```ts
 * import { StakingClient } from '@human-protocol/sdk';
 * import { providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const stakingClient = await StakingClient.build(provider);
 * ```
 */
export class StakingClient extends BaseEthersClient {
  public tokenContract: HMToken;
  public stakingContract: Staking;
  public escrowFactoryContract: EscrowFactory;
  public rewardPoolContract: RewardPool;

  /**
   * **StakingClient constructor**
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the Staking contract
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    super(runner, networkData);

    this.stakingContract = Staking__factory.connect(
      networkData.stakingAddress,
      runner
    );

    this.escrowFactoryContract = EscrowFactory__factory.connect(
      networkData.factoryAddress,
      runner
    );

    this.tokenContract = HMToken__factory.connect(
      networkData.hmtAddress,
      runner
    );

    this.rewardPoolContract = RewardPool__factory.connect(
      networkData.rewardPoolAddress,
      this.runner
    );
  }

  /**
   * Creates an instance of StakingClient from a Runner.
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   * @param {number | undefined} gasPriceMultiplier - The multiplier to apply to the gas price
   *
   * @returns {Promise<StakingClient>} - An instance of StakingClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(runner: ContractRunner) {
    if (!runner.provider) {
      throw ErrorProviderDoesNotExist;
    }

    const network = await runner.provider?.getNetwork();

    const chainId: ChainId = Number(network?.chainId);
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new StakingClient(runner, networkData);
  }

  /**
   * Check if escrow exists
   *
   * @param escrowAddress Escrow address to check against
   */
  private async checkValidEscrow(escrowAddress: string) {
    if (!ethers.isAddress(escrowAddress)) {
      throw ErrorInvalidEscrowAddressProvided;
    }

    if (!(await this.escrowFactoryContract.hasEscrow(escrowAddress))) {
      throw ErrorEscrowAddressIsNotProvidedByFactory;
    }
  }

  /**
   * This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.
   *
   * @param {bigint} amount Amount in WEI of tokens to approve for stake.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount);
   * ```
   */
  @requiresSigner
  public async approveStake(
    amount: bigint,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await (
        await this.tokenContract.approve(
          await this.stakingContract.getAddress(),
          amount,
          txOptions
        )
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function stakes a specified amount of tokens on a specific network.
   *
   * > `approveStake` must be called before
   *
   * @param {bigint} amount Amount in WEI of tokens to stake.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
   * await stakingClient.approveStake(amount);
   * ```
   */
  @requiresSigner
  public async stake(amount: bigint, txOptions: Overrides = {}): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await (await this.stakingContract.stake(amount, txOptions)).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.
   *
   * > Must have tokens available to unstake
   *
   * @param {bigint} amount Amount in WEI of tokens to unstake.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.unstake(amount);
   * ```
   */
  @requiresSigner
  public async unstake(
    amount: bigint,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await (await this.stakingContract.unstake(amount, txOptions)).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function withdraws unstaked and non locked tokens form staking contract to the user wallet.
   *
   * > Must have tokens available to withdraw
   *
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * await stakingClient.withdraw();
   * ```
   */
  @requiresSigner
  public async withdraw(txOptions: Overrides = {}): Promise<void> {
    try {
      await (await this.stakingContract.withdraw(txOptions)).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function reduces the allocated amount by an staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.
   *
   * @param {string} slasher Wallet address from who requested the slash
   * @param {string} staker Wallet address from who is going to be slashed
   * @param {string} escrowAddress Address of the escrow which allocation will be slashed
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @param {bigint} amount Amount in WEI of tokens to unstake.
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.slash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
  public async slash(
    slasher: string,
    staker: string,
    escrowAddress: string,
    amount: bigint,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    if (!ethers.isAddress(slasher)) {
      throw ErrorInvalidSlasherAddressProvided;
    }

    if (!ethers.isAddress(staker)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    await this.checkValidEscrow(escrowAddress);

    try {
      await (
        await this.stakingContract.slash(
          slasher,
          staker,
          escrowAddress,
          amount,
          txOptions
        )
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function allocates a portion of the staked tokens to a specific escrow.
   *
   * > Must have tokens staked
   *
   * @param {string} escrowAddress Address of the escrow contract to allocate in.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @param {bigint} amount Amount in WEI of tokens to allocate.
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
  public async allocate(
    escrowAddress: string,
    amount: bigint,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    await this.checkValidEscrow(escrowAddress);

    try {
      await (
        await this.stakingContract.allocate(escrowAddress, amount, txOptions)
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function drops the allocation from a specific escrow.
   *
   * > The escrow must have allocation
   * > The escrow must be cancelled or completed.
   *
   * @param {string} escrowAddress Address of the escrow contract to close allocation from.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * await stakingClient.closeAllocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  public async closeAllocation(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    await this.checkValidEscrow(escrowAddress);

    try {
      await (
        await this.stakingContract.closeAllocation(escrowAddress, txOptions)
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function drops the allocation from a specific escrow.
   *
   * > The escrow must have rewards added
   *
   * @param {string} escrowAddress Escrow address from which rewards are distributed.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * await stakingClient.distributeReward('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  public async distributeReward(
    escrowAddress: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    await this.checkValidEscrow(escrowAddress);

    try {
      (
        await this.rewardPoolContract.distributeReward(escrowAddress, txOptions)
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns all the leader details of the protocol.
   *
   * @param {ILeadersFilter} filter Filter for the leaders.
   * @returns {ILeader[]} Returns an array with all the leader details.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   * import { providers } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const stakingClient = await StakingClient.build(provider);
   *
   * const leaders = await stakingClient.getLeaders();
   * ```
   */
  public async getLeader(address: string): Promise<ILeader> {
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const { leader } = await gqlFetch<{
        leader: ILeader;
      }>(this.networkData.subgraphUrl, GET_LEADER_QUERY, {
        address: address.toLowerCase(),
      });

      return leader;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns the leader data for the given address.
   *
   * @param {string} address Leader address.
   * @returns {ILeader} Returns the leader details.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   * import { providers } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const stakingClient = await StakingClient.build(provider);
   *
   * const leader = await stakingClient.getLeader('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public async getLeaders(filter: ILeadersFilter = {}): Promise<ILeader[]> {
    try {
      const { leaders } = await gqlFetch<{
        leaders: ILeader[];
      }>(this.networkData.subgraphUrl, GET_LEADERS_QUERY(filter), {
        role: filter.role,
      });

      return leaders;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns information about the allocation of the specified escrow.
   *
   * @param {string} escrowAddress Escrow address from which we want to get allocation information.
   * @returns {IAllocation} Returns allocation info if exists.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   * import { providers } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const stakingClient = await StakingClient.build(provider);
   *
   * const allocationInfo = await stakingClient.getAllocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public async getAllocation(escrowAddress: string): Promise<IAllocation> {
    await this.checkValidEscrow(escrowAddress);

    try {
      const result = await this.stakingContract.getAllocation(escrowAddress);
      return result;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function returns information about the rewards for a given slasher address.
   *
   * @param {string} slasherAddress Slasher address.
   * @returns {IReward[]} Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   * import { providers } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const stakingClient = await StakingClient.build(provider);
   *
   * const rewards = await stakingClient.getRewards('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public async getRewards(slasherAddress: string): Promise<IReward[]> {
    if (!ethers.isAddress(slasherAddress)) {
      throw ErrorInvalidSlasherAddressProvided;
    }

    try {
      const { rewardAddedEvents } = await gqlFetch<{
        rewardAddedEvents: RewardAddedEventData[];
      }>(this.networkData.subgraphUrl, GET_REWARD_ADDED_EVENTS_QUERY, {
        slasherAddress: slasherAddress.toLowerCase(),
      });

      return rewardAddedEvents.map((reward: any) => {
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
