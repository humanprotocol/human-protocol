import {
  EscrowFactory,
  EscrowFactory__factory,
  HMToken,
  HMToken__factory,
  Staking,
  Staking__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, Overrides, ethers } from 'ethers';
import gqlFetch from 'graphql-request';
import { BaseEthersClient } from './base';
import { NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId, OrderDirection } from './enums';
import {
  ErrorEscrowAddressIsNotProvidedByFactory,
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorProviderDoesNotExist,
  ErrorStakerNotFound,
  ErrorUnsupportedChainID,
} from './error';
import { IStaker, IStakersFilter, StakerInfo } from './interfaces';
import { NetworkData } from './types';
import { getSubgraphUrl, throwError } from './utils';
import {
  GET_STAKER_BY_ADDRESS_QUERY,
  GET_STAKERS_QUERY,
} from './graphql/queries/staking';

/**
 * ## Introduction
 *
 * This client enables performing actions on staking contracts and obtaining staking information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner): Promise<StakingClient>;
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model to send transactions calling the contract functions.
 * - **Provider**: when the user wants to use this model to get information from the contracts or subgraph.
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
 * **Using private key (backend)**
 *
 * ```ts
 * import { StakingClient } from '@human-protocol/sdk';
 * import { Wallet, providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY';
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const stakingClient = await StakingClient.build(signer);
 * ```
 *
 * **Using Wagmi (frontend)**
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

  /**
   * **StakingClient constructor**
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   * @param {NetworkData} networkData - The network information required to connect to the Staking contract
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
  }

  /**
   * Creates an instance of StakingClient from a Runner.
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   *
   * @returns {Promise<StakingClient>} - An instance of StakingClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(runner: ContractRunner): Promise<StakingClient> {
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
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
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
          this.applyTxDefaults(txOptions)
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
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   *
   * const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
   * await stakingClient.stake(amount);
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
      await (
        await this.stakingContract.stake(
          amount,
          this.applyTxDefaults(txOptions)
        )
      ).wait();
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
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
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
      await (
        await this.stakingContract.unstake(
          amount,
          this.applyTxDefaults(txOptions)
        )
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function withdraws unstaked and non-locked tokens from staking contract to the user wallet.
   *
   * > Must have tokens available to withdraw
   *
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   * **Code example**
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
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
      await (
        await this.stakingContract.withdraw(this.applyTxDefaults(txOptions))
      ).wait();
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function reduces the allocated amount by a staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.
   *
   * @param {string} slasher Wallet address from who requested the slash
   * @param {string} staker Wallet address from who is going to be slashed
   * @param {string} escrowAddress Address of the escrow that the slash is made
   * @param {bigint} amount Amount in WEI of tokens to slash.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   * **Code example**
   *
   * ```ts
   * import { ethers, Wallet, providers } from 'ethers';
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
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
          this.applyTxDefaults(txOptions)
        )
      ).wait();

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Retrieves comprehensive staking information for a staker.
   *
   * @param {string} stakerAddress - The address of the staker.
   * @returns {Promise<StakerInfo>}
   *
   * **Code example**
   *
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const stakingClient = await StakingClient.build(provider);
   *
   * const stakingInfo = await stakingClient.getStakerInfo('0xYourStakerAddress');
   * console.log(stakingInfo.tokensStaked);
   * ```
   */
  public async getStakerInfo(stakerAddress: string): Promise<StakerInfo> {
    if (!ethers.isAddress(stakerAddress)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const stakerInfo = await this.stakingContract.stakes(stakerAddress);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const currentBlock = await this.runner.provider!.getBlockNumber();

      const tokensWithdrawable =
        stakerInfo.tokensLockedUntil !== 0n &&
        currentBlock >= stakerInfo.tokensLockedUntil
          ? stakerInfo.tokensLocked
          : 0n;

      const adjustedLockedAmount =
        stakerInfo.tokensLockedUntil !== 0n &&
        currentBlock >= stakerInfo.tokensLockedUntil
          ? 0n
          : stakerInfo.tokensLocked;

      return {
        stakedAmount: stakerInfo.tokensStaked,
        lockedAmount: adjustedLockedAmount,
        lockedUntil:
          adjustedLockedAmount === 0n ? 0n : stakerInfo.tokensLockedUntil,
        withdrawableAmount: tokensWithdrawable,
      };
    } catch (error) {
      return throwError(error);
    }
  }
}

/**
 * Utility class for Staking-related subgraph queries.
 */
export class StakingUtils {
  /**
   * Gets staking info for a staker from the subgraph.
   *
   * @param {ChainId} chainId Network in which the staking contract is deployed
   * @param {string} stakerAddress Address of the staker
   * @returns {Promise<IStaker>} Staker info from subgraph
   */
  public static async getStaker(
    chainId: ChainId,
    stakerAddress: string
  ): Promise<IStaker> {
    if (!ethers.isAddress(stakerAddress)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    const networkData: NetworkData | undefined = NETWORKS[chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { staker } = await gqlFetch<{ staker: IStaker }>(
      getSubgraphUrl(networkData),
      GET_STAKER_BY_ADDRESS_QUERY,
      { id: stakerAddress.toLowerCase() }
    );

    if (!staker) {
      throw ErrorStakerNotFound;
    }

    return staker;
  }

  /**
   * Gets all stakers from the subgraph with filters, pagination and ordering.
   *
   * @returns {Promise<IStaker[]>} Array of stakers
   */
  public static async getStakers(filter: IStakersFilter): Promise<IStaker[]> {
    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;
    const orderBy = filter.orderBy || 'lastDepositTimestamp';

    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { stakers } = await gqlFetch<{ stakers: IStaker[] }>(
      getSubgraphUrl(networkData),
      GET_STAKERS_QUERY(filter),
      {
        minStakedAmount: filter.minStakedAmount
          ? filter.minStakedAmount
          : undefined,
        maxStakedAmount: filter.maxStakedAmount
          ? filter.maxStakedAmount
          : undefined,
        minLockedAmount: filter.minLockedAmount
          ? filter.minLockedAmount
          : undefined,
        maxLockedAmount: filter.maxLockedAmount
          ? filter.maxLockedAmount
          : undefined,
        minWithdrawnAmount: filter.minWithdrawnAmount
          ? filter.minWithdrawnAmount
          : undefined,
        maxWithdrawnAmount: filter.maxWithdrawnAmount
          ? filter.maxWithdrawnAmount
          : undefined,
        minSlashedAmount: filter.minSlashedAmount
          ? filter.minSlashedAmount
          : undefined,
        maxSlashedAmount: filter.maxSlashedAmount
          ? filter.maxSlashedAmount
          : undefined,
        orderBy: orderBy,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      }
    );
    if (!stakers) {
      return [];
    }

    return stakers;
  }
}
