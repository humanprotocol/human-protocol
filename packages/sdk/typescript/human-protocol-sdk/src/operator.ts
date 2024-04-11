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
import { NetworkData } from './types';
import {
  GET_LEADER_QUERY,
  GET_LEADERS_QUERY,
  GET_REPUTATION_NETWORK_QUERY,
} from './graphql/queries/operator';
import { ContractRunner, ethers } from 'ethers';
import { BaseEthersClient } from './base';
import {
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorUnsupportedChainID,
  ErrorProviderDoesNotExist,
} from './error';
import { throwError } from './utils';
import { ChainId } from './enums';
import { requiresSigner } from './decorators';
import { NETWORKS } from './constants';
import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';

export class OperatorUtils extends BaseEthersClient {
  public kvStoreContract: KVStore;

  /**
   * **KVStoreClient constructor**
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the Staking contract
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    super(runner, networkData);

    this.kvStoreContract = KVStore__factory.connect(
      networkData.kvstoreAddress,
      runner
    );
  }

  /**
   * Static method to build an instance of OperatorUtils with necessary setup.
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network.
   * @returns {Promise<OperatorUtils>} - An instance of OperatorUtils.
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported.
   */
  public static async build(runner: ContractRunner) {
    if (!runner.provider) {
      throw ErrorProviderDoesNotExist;
    }

    const network = await runner.provider.getNetwork();
    const chainId: ChainId = Number(network.chainId);
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new OperatorUtils(runner, networkData);
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
   * import { OperatorUtils, ChainId } from '@human-protocol/sdk';
   *
   * const leader = await OperatorUtils.getLeader(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
    filter: ILeadersFilter = { networks: [ChainId.POLYGON_MUMBAI] }
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
   * const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
   * ```
   */
  @requiresSigner
  public async getReputationNetworkOperators(
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

      const operatorsWithDetails = await Promise.all(
        reputationNetwork.operators.map(async (operator) => {
          const operatorAddress = ethers.getAddress(operator.address);
          const url = await this.kvStoreContract.get(operatorAddress, 'url');
          const jobTypesJson = await this.kvStoreContract.get(
            operatorAddress,
            'job_types'
          );
          const jobTypes = JSON.parse(jobTypesJson || '[]');
          return {
            ...operator,
            url,
            job_types: jobTypes,
          };
        })
      );

      return operatorsWithDetails;
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
   * const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
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
