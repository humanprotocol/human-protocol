import {
  EscrowFactory,
  EscrowFactory__factory,
  HMToken,
  HMToken__factory,
  Staking,
  Staking__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, ethers } from 'ethers';
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
import {
  IStaker,
  IStakersFilter,
  StakerInfo,
  SubgraphOptions,
} from './interfaces';
import { StakerData } from './graphql';
import { NetworkData, TransactionOverrides } from './types';
import { getStakingSubgraphUrl, customGqlFetch, throwError } from './utils';
import {
  GET_STAKER_BY_ADDRESS_QUERY,
  GET_STAKERS_QUERY,
} from './graphql/queries/staking';

/**
 * Client for staking actions on HUMAN Protocol.
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
 * @example
 *
 * ###Using Signer
 *
 * ####Using private key (backend)
 *
 * ```ts
 * import { StakingClient } from '@human-protocol/sdk';
 * import { Wallet, JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY';
 *
 * const provider = new JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const stakingClient = await StakingClient.build(signer);
 * ```
 *
 * ####Using Wagmi (frontend)
 *
 * ```ts
 * import { useSigner, useChainId } from 'wagmi';
 * import { StakingClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const stakingClient = await StakingClient.build(signer);
 * ```
 *
 * ###Using Provider
 *
 * ```ts
 * import { StakingClient } from '@human-protocol/sdk';
 * import { JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 *
 * const provider = new JsonRpcProvider(rpcUrl);
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
   * @param runner - The Runner object to interact with the Ethereum network
   * @param networkData - The network information required to connect to the Staking contract
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
   * @param runner - The Runner object to interact with the Ethereum network
   * @returns An instance of StakingClient
   * @throws ErrorProviderDoesNotExist If the provider does not exist for the provided Signer
   * @throws ErrorUnsupportedChainID If the network's chainId is not supported
   *
   * @example
   * ```ts
   * import { StakingClient } from '@human-protocol/sdk';
   * import { Wallet, JsonRpcProvider } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const stakingClient = await StakingClient.build(signer);
   * ```
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
   * @param amount - Amount in WEI of tokens to approve for stake.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidStakingValueType If the amount is not a bigint
   * @throws ErrorInvalidStakingValueSign If the amount is negative
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount);
   * ```
   */
  @requiresSigner
  public async approveStake(
    amount: bigint,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.sendTxAndWait(
        async (overrides) =>
          this.tokenContract.approve(
            await this.stakingContract.getAddress(),
            amount,
            overrides
          ),
        txOptions
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function stakes a specified amount of tokens on a specific network.
   *
   * !!! note
   *     `approveStake` must be called before
   *
   * @param amount - Amount in WEI of tokens to stake.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidStakingValueType If the amount is not a bigint
   * @throws ErrorInvalidStakingValueSign If the amount is negative
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
   * await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
   * await stakingClient.stake(amount);
   * ```
   */
  @requiresSigner
  public async stake(
    amount: bigint,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.sendTxAndWait(
        (overrides) => this.stakingContract.stake(amount, overrides),
        txOptions
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.
   *
   * !!! note
   *     Must have tokens available to unstake
   *
   * @param amount - Amount in WEI of tokens to unstake.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidStakingValueType If the amount is not a bigint
   * @throws ErrorInvalidStakingValueSign If the amount is negative
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
   * await stakingClient.unstake(amount);
   * ```
   */
  @requiresSigner
  public async unstake(
    amount: bigint,
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (typeof amount !== 'bigint') {
      throw ErrorInvalidStakingValueType;
    }

    if (amount < 0n) {
      throw ErrorInvalidStakingValueSign;
    }

    try {
      await this.sendTxAndWait(
        (overrides) => this.stakingContract.unstake(amount, overrides),
        txOptions
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function withdraws unstaked and non-locked tokens from staking contract to the user wallet.
   * !!! note
   *     Must have tokens available to withdraw
   *
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   *
   * @example
   * ```ts
   * await stakingClient.withdraw();
   * ```
   */
  @requiresSigner
  public async withdraw(txOptions: TransactionOverrides = {}): Promise<void> {
    try {
      await this.sendTxAndWait(
        (overrides) => this.stakingContract.withdraw(overrides),
        txOptions
      );
      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * This function reduces the allocated amount by a staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.
   *
   * @param slasher - Wallet address from who requested the slash
   * @param staker - Wallet address from who is going to be slashed
   * @param escrowAddress - Address of the escrow that the slash is made
   * @param amount - Amount in WEI of tokens to slash.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @returns -
   * @throws ErrorInvalidStakingValueType If the amount is not a bigint
   * @throws ErrorInvalidStakingValueSign If the amount is negative
   * @throws ErrorInvalidSlasherAddressProvided If the slasher address is invalid
   * @throws ErrorInvalidStakerAddressProvided If the staker address is invalid
   * @throws ErrorInvalidEscrowAddressProvided If the escrow address is invalid
   * @throws ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory
   *
   * @example
   * ```ts
   * import { ethers } from 'ethers';
   *
   * const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
   * await stakingClient.slash(
   *   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *   '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
   *   amount
   * );
   * ```
   */
  @requiresSigner
  public async slash(
    slasher: string,
    staker: string,
    escrowAddress: string,
    amount: bigint,
    txOptions: TransactionOverrides = {}
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
      await this.sendTxAndWait(
        (overrides) =>
          this.stakingContract.slash(
            slasher,
            staker,
            escrowAddress,
            amount,
            overrides
          ),
        txOptions
      );

      return;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Retrieves comprehensive staking information for a staker.
   *
   * @param stakerAddress - The address of the staker.
   * @returns Staking information for the staker
   * @throws ErrorInvalidStakerAddressProvided If the staker address is invalid
   *
   * @example
   * ```ts
   * const stakingInfo = await stakingClient.getStakerInfo('0xYourStakerAddress');
   * console.log('Tokens staked:', stakingInfo.stakedAmount);
   * ```
   */
  public async getStakerInfo(stakerAddress: string): Promise<StakerInfo> {
    if (!ethers.isAddress(stakerAddress)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    try {
      const stakerInfo = await this.stakingContract.stakes(stakerAddress);

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
 * Utility helpers for Staking-related queries.
 *
 * @example
 * ```ts
 * import { StakingUtils, ChainId } from '@human-protocol/sdk';
 *
 * const staker = await StakingUtils.getStaker(
 *   ChainId.POLYGON_AMOY,
 *   '0xYourStakerAddress'
 * );
 * console.log('Staked amount:', staker.stakedAmount);
 * ```
 */
export class StakingUtils {
  /**
   * Gets staking info for a staker from the subgraph.
   *
   * @param chainId - Network in which the staking contract is deployed
   * @param stakerAddress - Address of the staker
   * @param options - Optional configuration for subgraph requests.
   * @returns Staker info from subgraph
   * @throws ErrorInvalidStakerAddressProvided If the staker address is invalid
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   * @throws ErrorStakerNotFound If the staker is not found
   *
   * @example
   * ```ts
   * import { StakingUtils, ChainId } from '@human-protocol/sdk';
   *
   * const staker = await StakingUtils.getStaker(
   *   ChainId.POLYGON_AMOY,
   *   '0xYourStakerAddress'
   * );
   * console.log('Staked amount:', staker.stakedAmount);
   * ```
   */
  public static async getStaker(
    chainId: ChainId,
    stakerAddress: string,
    options?: SubgraphOptions
  ): Promise<IStaker> {
    if (!ethers.isAddress(stakerAddress)) {
      throw ErrorInvalidStakerAddressProvided;
    }

    const networkData: NetworkData | undefined = NETWORKS[chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { staker } = await customGqlFetch<{ staker: StakerData }>(
      getStakingSubgraphUrl(networkData),
      GET_STAKER_BY_ADDRESS_QUERY,
      { id: stakerAddress.toLowerCase() },
      options
    );

    if (!staker) {
      throw ErrorStakerNotFound;
    }

    return mapStaker(staker);
  }

  /**
   * Gets all stakers from the subgraph with filters, pagination and ordering.
   *
   * @param filter - Stakers filter with pagination and ordering
   * @param options - Optional configuration for subgraph requests.
   * @returns Array of stakers
   * @throws ErrorUnsupportedChainID If the chain ID is not supported
   *
   * @example
   * ```ts
   * import { ChainId } from '@human-protocol/sdk';
   *
   * const filter = {
   *   chainId: ChainId.POLYGON_AMOY,
   *   minStakedAmount: '1000000000000000000', // 1 token in WEI
   * };
   * const stakers = await StakingUtils.getStakers(filter);
   * console.log('Stakers:', stakers.length);
   * ```
   */
  public static async getStakers(
    filter: IStakersFilter,
    options?: SubgraphOptions
  ): Promise<IStaker[]> {
    const first =
      filter.first !== undefined ? Math.min(filter.first, 1000) : 10;
    const skip = filter.skip || 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;
    const orderBy = filter.orderBy || 'lastDepositTimestamp';

    const networkData = NETWORKS[filter.chainId];
    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { stakers } = await customGqlFetch<{ stakers: StakerData[] }>(
      getStakingSubgraphUrl(networkData),
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
      },
      options
    );
    if (!stakers) {
      return [];
    }

    return stakers.map((s) => mapStaker(s));
  }
}

function mapStaker(s: StakerData): IStaker {
  return {
    address: s.address,
    stakedAmount: BigInt(s.stakedAmount),
    lockedAmount: BigInt(s.lockedAmount),
    withdrawableAmount: BigInt(s.withdrawnAmount),
    slashedAmount: BigInt(s.slashedAmount),
    lockedUntil: Number(s.lockedUntilTimestamp) * 1000,
    lastDepositTimestamp: Number(s.lastDepositTimestamp) * 1000,
  };
}
