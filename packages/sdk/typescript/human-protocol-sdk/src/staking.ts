/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from '@ethersproject/abstract-provider';
import { Network } from '@ethersproject/networks';
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
import { BigNumber, Signer, ethers } from 'ethers';
import gqlFetch from 'graphql-request';
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
 * Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(signerOrProvider: Signer | Provider);
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
export class StakingClient {
  public signerOrProvider: Signer | Provider;
  public network: NetworkData;
  public tokenContract: HMToken;
  public stakingContract: Staking;
  public escrowFactoryContract: EscrowFactory;

  /**
   * **StakingClient constructor**
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the Staking contract
   */
  constructor(signerOrProvider: Signer | Provider, network: NetworkData) {
    this.stakingContract = Staking__factory.connect(
      network.stakingAddress,
      signerOrProvider
    );

    this.escrowFactoryContract = EscrowFactory__factory.connect(
      network.factoryAddress,
      signerOrProvider
    );

    this.tokenContract = HMToken__factory.connect(
      network.hmtAddress,
      signerOrProvider
    );

    this.signerOrProvider = signerOrProvider;
    this.network = network;
  }

  /**
   * Creates an instance of StakingClient from a Signer or Provider.
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @returns {Promise<StakingClient>} - An instance of StakingClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(signerOrProvider: Signer | Provider) {
    let network: Network;
    if (Signer.isSigner(signerOrProvider)) {
      if (!signerOrProvider.provider) {
        throw ErrorProviderDoesNotExist;
      }

      network = await signerOrProvider.provider.getNetwork();
    } else {
      network = await signerOrProvider.getNetwork();
    }

    const chainId: ChainId = network.chainId;
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new StakingClient(signerOrProvider, networkData);
  }

  /**
   * This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.
   *
   * @param {BigNumber} amount Amount in WEI of tokens to approve for stake.
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
   * const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount);
   * ```
   */
  @requiresSigner
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
   * This function stakes a specified amount of tokens on a specific network.
   *
   * > `approveStake` must be called before
   *
   * @param {BigNumber} amount Amount in WEI of tokens to stake.
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
   * const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
   * await stakingClient.approveStake(amount);
   * ```
   */
  @requiresSigner
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
   * This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.
   *
   * > Must have tokens available to unstake
   *
   * @param {BigNumber} amount Amount in WEI of tokens to unstake.
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
   * const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.unstake(amount);
   * ```
   */
  @requiresSigner
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
   * This function withdraws unstaked and non locked tokens form staking contract to the user wallet.
   *
   * > Must have tokens available to withdraw
   *
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
  public async withdraw(): Promise<void> {
    try {
      await this.stakingContract.withdraw();
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
   * @param {BigNumber} amount Amount in WEI of tokens to unstake.
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
   * const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.slash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
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
   * This function allocates a portion of the staked tokens to a specific escrow.
   *
   * > Must have tokens staked
   *
   * @param {string} escrowAddress Address of the escrow contract to allocate in.
   * @param {BigNumber} amount Amount in WEI of tokens to allocate.
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
   * const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
   * ```
   */
  @requiresSigner
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
   * This function drops the allocation from a specific escrow.
   *
   * > The escrow must have allocation
   * > The escrow must be cancelled or completed.
   *
   * @param {string} escrowAddress Address of the escrow contract to close allocation from.
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
   * This function drops the allocation from a specific escrow.
   *
   * > The escrow must have rewards added
   *
   * @param {string} escrowAddress Escrow address from which rewards are distributed.
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
   * await stakingClient.distributeRewards('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
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
    if (!ethers.utils.isAddress(address)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const { leader } = await gqlFetch<{
        leader: ILeader;
      }>(this.network.subgraphUrl, GET_LEADER_QUERY, {
        address,
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
      }>(this.network.subgraphUrl, GET_LEADERS_QUERY(filter), {
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
    if (!ethers.utils.isAddress(slasherAddress)) {
      throw ErrorInvalidSlasherAddressProvided;
    }

    try {
      const { rewardAddedEvents } = await gqlFetch<{
        rewardAddedEvents: RewardAddedEventData[];
      }>(this.network.subgraphUrl, GET_REWARD_ADDED_EVENTS_QUERY, {
        slasherAddress,
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
