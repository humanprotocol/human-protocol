/* eslint-disable @typescript-eslint/no-explicit-any */
import gqlFetch from 'graphql-request';
import {
  ILeader,
  ILeadersFilter,
  IOperator,
  IReputationNetwork,
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
import { throwError } from './utils';
import { ChainId } from './enums';
import { NETWORKS } from './constants';

export class OperatorUtils {
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
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const leader = await OperatorUtils.getLeader(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  public static async getLeader(
    chainId: ChainId,
    address: string
  ): Promise<ILeader> {
    if (!ethers.isAddress(address)) {
      throw ErrorInvalidStakerAddressProvided;
    }
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    try {
      const { leader } = await gqlFetch<{
        leader: ILeader;
      }>(networkData.subgraphUrl, GET_LEADER_QUERY, {
        address: address.toLowerCase(),
      });

      return leader;
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
   * import { OperatorUtils } from '@human-protocol/sdk';
   *
   * const leaders = await OperatorUtils.getLeaders();
   * ```
   */
  public static async getLeaders(
    filter: ILeadersFilter = { networks: [ChainId.POLYGON_AMOY] }
  ): Promise<ILeader[]> {
    try {
      let leaders_data: ILeader[] = [];
      for (const chainId of filter.networks) {
        const networkData = NETWORKS[chainId];

        if (!networkData) {
          throw ErrorUnsupportedChainID;
        }
        const { leaders } = await gqlFetch<{
          leaders: ILeader[];
        }>(networkData.subgraphUrl, GET_LEADERS_QUERY(filter), {
          role: filter.role,
        });
        leaders_data = leaders_data.concat(leaders);
      }

      return leaders_data;
    } catch (e) {
      return throwError(e);
    }
  }

  /**
   * Retrieves the reputation network operators of the specified address.
   *
   * @param {string} address - Address of the reputation oracle.
   * @param {string} [role] - (Optional) Role of the operator.
   * @returns {Promise<IOperator[]>} - Returns an array of operator details.
   *
   * @example
   * ```typescript
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
    try {
      const { reputationNetwork } = await gqlFetch<{
        reputationNetwork: IReputationNetwork;
      }>(networkData.subgraphUrl, GET_REPUTATION_NETWORK_QUERY(role), {
        address: address.toLowerCase(),
        role: role,
      });

      return reputationNetwork.operators;
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

    try {
      const { rewardAddedEvents } = await gqlFetch<{
        rewardAddedEvents: RewardAddedEventData[];
      }>(networkData.subgraphUrl, GET_REWARD_ADDED_EVENTS_QUERY, {
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
