/* eslint-disable @typescript-eslint/no-explicit-any */
import gqlFetch from 'graphql-request';
import {
  IOperator,
  IOperatorSubgraph,
  IOperatorsFilter,
  IReputationNetworkSubgraph,
  IReward,
} from './interfaces';
import { GET_REWARD_ADDED_EVENTS_QUERY } from './graphql/queries/reward';
import { RewardAddedEventData } from './graphql';
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
import { getSubgraphUrl } from './utils';
import { ChainId, OrderDirection } from './enums';
import { NETWORKS } from './constants';

export class OperatorUtils {
  /**
   * This function returns the operator data for the given address.
   *
   * @param {ChainId} chainId Network in which the operator is deployed
   * @param {string} address Operator address.
   * @returns {Promise<IOperator>} Returns the operator details.
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
    address: string
  ): Promise<IOperator> {
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidStakerAddressProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { operator } = await gqlFetch<{
      operator: IOperatorSubgraph;
    }>(getSubgraphUrl(networkData), GET_LEADER_QUERY, {
      address: address.toLowerCase(),
    });

    if (!operator) {
      return (operator as IOperator) || null;
    }

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
      ...operator,
      jobTypes,
      reputationNetworks,
      chainId,
    };
  }

  /**
   * This function returns all the operator details of the protocol.
   *
   * @param {IOperatorsFilter} filter Filter for the operators.
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
    filter: IOperatorsFilter
  ): Promise<IOperator[]> {
    let operators_data: IOperator[] = [];

    const first =
      filter.first !== undefined && filter.first > 0
        ? Math.min(filter.first, 1000)
        : 10;
    const skip =
      filter.skip !== undefined && filter.skip >= 0 ? filter.skip : 0;
    const orderDirection = filter.orderDirection || OrderDirection.DESC;

    const networkData = NETWORKS[filter.chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { operators } = await gqlFetch<{
      operators: IOperatorSubgraph[];
    }>(getSubgraphUrl(networkData), GET_LEADERS_QUERY(filter), {
      minAmountStaked: filter?.minAmountStaked,
      roles: filter?.roles,
      orderBy: filter?.orderBy,
      orderDirection: orderDirection,
      first: first,
      skip: skip,
    });

    if (!operators) {
      return [];
    }

    operators_data = operators_data.concat(
      operators.map((operator) => {
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
          ...operator,
          jobTypes,
          reputationNetworks,
          chainId: filter.chainId,
        };
      })
    );
    return operators_data;
  }

  /**
   * Retrieves the reputation network operators of the specified address.
   *
   * @param {ChainId} chainId Network in which the reputation network is deployed
   * @param {string} address Address of the reputation oracle.
   * @param {string} [role] - (Optional) Role of the operator.
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
    role?: string
  ): Promise<IOperator[]> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }
    const { reputationNetwork } = await gqlFetch<{
      reputationNetwork: IReputationNetworkSubgraph;
    }>(getSubgraphUrl(networkData), GET_REPUTATION_NETWORK_QUERY(role), {
      address: address.toLowerCase(),
      role: role,
    });

    if (!reputationNetwork) return [];

    return reputationNetwork.operators.map((operator) => {
      let jobTypes: string[] = [];

      if (typeof operator.jobTypes === 'string') {
        jobTypes = operator.jobTypes.split(',');
      } else if (Array.isArray(operator.jobTypes)) {
        jobTypes = operator.jobTypes;
      }

      return {
        chainId,
        ...operator,
        jobTypes,
        reputationNetworks: operator.reputationNetworks?.map(
          (network) => network.address
        ),
      };
    });
  }

  /**
   * This function returns information about the rewards for a given slasher address.
   *
   * @param {ChainId} chainId Network in which the rewards are deployed
   * @param {string} slasherAddress Slasher address.
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
    slasherAddress: string
  ): Promise<IReward[]> {
    if (!ethers.isAddress(slasherAddress)) {
      throw ErrorInvalidSlasherAddressProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { rewardAddedEvents } = await gqlFetch<{
      rewardAddedEvents: RewardAddedEventData[];
    }>(getSubgraphUrl(networkData), GET_REWARD_ADDED_EVENTS_QUERY, {
      slasherAddress: slasherAddress.toLowerCase(),
    });

    if (!rewardAddedEvents) return [];

    return rewardAddedEvents.map((reward: any) => {
      return {
        escrowAddress: reward.escrow,
        amount: reward.amount,
      };
    });
  }
}
