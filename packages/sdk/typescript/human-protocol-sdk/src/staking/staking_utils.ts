import { ethers } from 'ethers';
import { NETWORKS } from '../constants';
import { ChainId, OrderDirection } from '../enums';
import {
  ErrorInvalidStakerAddressProvided,
  ErrorStakerNotFound,
  ErrorUnsupportedChainID,
} from '../error';
import { StakerData } from '../graphql';
import {
  GET_STAKER_BY_ADDRESS_QUERY,
  GET_STAKERS_QUERY,
} from '../graphql/queries/staking';
import { IStaker, IStakersFilter, SubgraphOptions } from '../interfaces';
import { NetworkData } from '../types';
import { customGqlFetch, getSubgraphUrl } from '../utils';
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
      getSubgraphUrl(networkData),
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
