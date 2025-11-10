/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IOperator,
  IOperatorsFilter,
  IReward,
  SubgraphOptions,
} from './interfaces';
import { GET_REWARD_ADDED_EVENTS_QUERY } from './graphql/queries/reward';
import {
  IOperatorSubgraph,
  IReputationNetworkSubgraph,
  RewardAddedEventData,
} from './graphql';
import {
  GET_LEADER_QUERY,
  GET_LEADERS_QUERY,
  GET_REPUTATION_NETWORK_QUERY,
} from './graphql/queries/operator';
import { ethers } from 'ethers';
import {
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorUnsupportedChainID,
} from './error';
import { getSubgraphUrl, customGqlFetch } from './utils';
import { ChainId, OrderDirection } from './enums';
import { NETWORKS } from './constants';

export class OperatorUtils {
  /**
   * This function returns the operator data for the given address.
   *
   * @param {ChainId} chainId Network in which the operator is deployed
   * @param {string} address Operator address.
   * @param {SubgraphOptions} options Optional configuration for subgraph requests.
   * @returns {Promise<IOperator | null>} - Returns the operator details or null if not found.
   *
   * **Code example**
   *
   * ```ts
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const operator = await OperatorUtils.getOperator(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public static async getOperator(
    chainId: ChainId,
    address: string,
    options?: SubgraphOptions
  ): Promise<IOperator | null> {
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidStakerAddressProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { operator } = await customGqlFetch<{
      operator: IOperatorSubgraph;
    }>(getSubgraphUrl(networkData), GET_LEADER_QUERY, {
      address: address.toLowerCase(),
      options,
    });

    if (!operator) {
      return null;
    }

    return mapOperator(operator, chainId);
  }

  /**
   * This function returns all the operator details of the protocol.
   *
   * @param {IOperatorsFilter} filter Filter for the operators.
   * @param {SubgraphOptions} options Optional configuration for subgraph requests.
   * @returns {Promise<IOperator[]>} Returns an array with all the operator details.
   *
   * **Code example**
   *
   * ```ts
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const filter: IOperatorsFilter = {
   *  chainId: ChainId.POLYGON
   * };
   * const operators = await OperatorUtils.getOperators(filter);
   * ```
   */
  public static async getOperators(
    filter: IOperatorsFilter,
    options?: SubgraphOptions
  ): Promise<IOperator[]> {
    const first =
      filter.first !== undefined && filter.first > 0
        ? Math.min(filter.first, 1000)
        : 10;
    const skip =
      filter.skip !== undefined && filter.skip >= 0 ? filter.skip : 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    let orderBy = filter.orderBy;
    if (filter.orderBy === 'stakedAmount') orderBy = 'staker__stakedAmount';
    else if (filter.orderBy === 'lockedAmount')
      orderBy = 'staker__lockedAmount';
    else if (filter.orderBy === 'withdrawnAmount')
      orderBy = 'staker__withdrawnAmount';
    else if (filter.orderBy === 'slashedAmount')
      orderBy = 'staker__slashedAmount';

    const networkData = NETWORKS[filter.chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { operators } = await customGqlFetch<{
      operators: IOperatorSubgraph[];
    }>(
      getSubgraphUrl(networkData),
      GET_LEADERS_QUERY(filter),
      {
        minStakedAmount: filter?.minStakedAmount,
        roles: filter?.roles,
        orderBy: orderBy,
        orderDirection: orderDirection,
        first: first,
        skip: skip,
      },
      options
    );

    if (!operators) {
      return [];
    }

    return operators.map((operator) => mapOperator(operator, filter.chainId));
  }

  /**
   * Retrieves the reputation network operators of the specified address.
   *
   * @param {ChainId} chainId Network in which the reputation network is deployed
   * @param {string} address Address of the reputation oracle.
   * @param {string} [role] - (Optional) Role of the operator.
   * @param {SubgraphOptions} options Optional configuration for subgraph requests.
   * @returns {Promise<IOperator[]>} - Returns an array of operator details.
   *
   * **Code example**
   *
   * ```ts
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public static async getReputationNetworkOperators(
    chainId: ChainId,
    address: string,
    role?: string,
    options?: SubgraphOptions
  ): Promise<IOperator[]> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    const { reputationNetwork } = await customGqlFetch<{
      reputationNetwork: IReputationNetworkSubgraph;
    }>(
      getSubgraphUrl(networkData),
      GET_REPUTATION_NETWORK_QUERY(role),
      {
        address: address.toLowerCase(),
        role: role,
      },
      options
    );

    if (!reputationNetwork) return [];

    return reputationNetwork.operators.map((operator) =>
      mapOperator(operator, chainId)
    );
  }

  /**
   * This function returns information about the rewards for a given slasher address.
   *
   * @param {ChainId} chainId Network in which the rewards are deployed
   * @param {string} slasherAddress Slasher address.
   * @param {SubgraphOptions} options Optional configuration for subgraph requests.
   * @returns {Promise<IReward[]>} Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.
   *
   * **Code example**
   *
   * ```ts
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public static async getRewards(
    chainId: ChainId,
    slasherAddress: string,
    options?: SubgraphOptions
  ): Promise<IReward[]> {
    if (!ethers.isAddress(slasherAddress)) {
      throw ErrorInvalidSlasherAddressProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { rewardAddedEvents } = await customGqlFetch<{
      rewardAddedEvents: RewardAddedEventData[];
    }>(
      getSubgraphUrl(networkData),
      GET_REWARD_ADDED_EVENTS_QUERY,
      {
        slasherAddress: slasherAddress.toLowerCase(),
      },
      options
    );

    if (!rewardAddedEvents) return [];

    return rewardAddedEvents.map((reward: any) => {
      return {
        escrowAddress: reward.escrow,
        amount: reward.amount,
      };
    });
  }
}

function mapOperator(operator: IOperatorSubgraph, chainId: ChainId): IOperator {
  const staker = operator?.staker;
  let jobTypes: string[] = [];
  let reputationNetworks: string[] = [];

  if (typeof operator.jobTypes === 'string') {
    jobTypes = operator.jobTypes.split(',');
  } else if (Array.isArray(operator.jobTypes)) {
    jobTypes = operator.jobTypes;
  }

  if (
    operator.reputationNetworks &&
    Array.isArray(operator.reputationNetworks)
  ) {
    reputationNetworks = operator.reputationNetworks.map(
      (network) => network.address
    );
  }

  return {
    id: operator.id,
    chainId,
    address: operator.address,
    stakedAmount: staker?.stakedAmount ? BigInt(staker?.stakedAmount) : null,
    lockedAmount: staker?.lockedAmount ? BigInt(staker?.lockedAmount) : null,
    lockedUntilTimestamp: staker?.lockedUntilTimestamp
      ? Number(staker.lockedUntilTimestamp) * 1000
      : null,
    withdrawnAmount: staker?.withdrawnAmount
      ? BigInt(staker?.withdrawnAmount)
      : null,
    slashedAmount: staker?.slashedAmount ? BigInt(staker?.slashedAmount) : null,
    amountJobsProcessed: operator.amountJobsProcessed
      ? BigInt(operator.amountJobsProcessed)
      : null,
    role: operator.role,
    fee: operator.fee ? BigInt(operator.fee) : null,
    publicKey: operator.publicKey,
    webhookUrl: operator.webhookUrl,
    website: operator.website,
    url: operator.url,
    jobTypes,
    registrationNeeded: operator.registrationNeeded,
    registrationInstructions: operator.registrationInstructions,
    reputationNetworks,
    name: operator.name,
    category: operator.category,
  };
}
