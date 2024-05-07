/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi } from 'vitest';
import { NETWORKS, Role } from '../src/constants';
import {
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
} from '../src/error';
import {
  GET_LEADERS_QUERY,
  GET_LEADER_QUERY,
  GET_REPUTATION_NETWORK_QUERY,
} from '../src/graphql/queries/operator';
import {
  ILeader,
  ILeaderSubgraph,
  IOperator,
  IOperatorSubgraph,
  IReputationNetworkSubgraph,
  IReward,
} from '../src/interfaces';
import { OperatorUtils } from '../src/operator';
import { ChainId } from '../src/enums';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

describe('OperatorUtils', () => {
  describe('getLeader', () => {
    const stakerAddress = ethers.ZeroAddress;
    const invalidAddress = 'InvalidAddress';

    const mockLeaderSubgraph: ILeaderSubgraph = {
      id: stakerAddress,
      chainId: ChainId.LOCALHOST,
      address: stakerAddress,
      amountStaked: ethers.parseEther('100'),
      amountAllocated: ethers.parseEther('50'),
      amountLocked: ethers.parseEther('25'),
      lockedUntilTimestamp: ethers.toBigInt(0),
      amountWithdrawn: ethers.parseEther('25'),
      amountSlashed: ethers.parseEther('25'),
      reputation: ethers.parseEther('25'),
      reward: ethers.parseEther('25'),
      amountJobsLaunched: ethers.parseEther('25'),
      jobTypes: 'type1,type2',
    };

    const mockLeader: ILeader = {
      ...mockLeaderSubgraph,
      jobTypes: ['type1', 'type2'],
    };

    test('should return staker information', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: mockLeaderSubgraph,
      });

      const result = await OperatorUtils.getLeader(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        }
      );
      expect(result).toEqual(mockLeader);
    });

    test('should throw an error for an invalid staker address', async () => {
      await expect(
        OperatorUtils.getLeader(ChainId.LOCALHOST, invalidAddress)
      ).rejects.toThrow(ErrorInvalidStakerAddressProvided);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        OperatorUtils.getLeader(ChainId.LOCALHOST, stakerAddress)
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLeaders', () => {
    const stakerAddress = ethers.ZeroAddress;

    const mockLeaderSubgraph: ILeaderSubgraph = {
      id: stakerAddress,
      chainId: ChainId.LOCALHOST,
      address: stakerAddress,
      amountStaked: ethers.parseEther('100'),
      amountAllocated: ethers.parseEther('50'),
      amountLocked: ethers.parseEther('25'),
      lockedUntilTimestamp: ethers.toBigInt(0),
      amountWithdrawn: ethers.parseEther('25'),
      amountSlashed: ethers.parseEther('25'),
      reputation: ethers.parseEther('25'),
      reward: ethers.parseEther('25'),
      amountJobsLaunched: ethers.parseEther('25'),
      jobTypes: 'type1,type2',
    };

    const mockLeader: ILeader = {
      ...mockLeaderSubgraph,
      jobTypes: ['type1', 'type2'],
    };

    test('should return an array of stakers', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph, mockLeaderSubgraph],
      });
      const filter = { networks: [ChainId.LOCALHOST], role: 'role' };

      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          role: filter.role,
        }
      );
      expect(result).toEqual([mockLeader, mockLeader]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(OperatorUtils.getLeaders()).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReputationNetworkOperators', () => {
    const stakerAddress = ethers.ZeroAddress;
    const mockOperatorSubgraph: IOperatorSubgraph = {
      address: '0x0000000000000000000000000000000000000001',
      role: Role.JobLauncher,
      url: 'www.google.com',
      jobTypes: 'type1,type2',
    };
    const mockOperator: IOperator = {
      ...mockOperatorSubgraph,
      jobTypes: ['type1', 'type2'],
    };
    const mockReputationNetwork: IReputationNetworkSubgraph = {
      id: stakerAddress,
      address: stakerAddress,
      operators: [mockOperatorSubgraph],
    };

    test('should return reputation network operators', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: mockReputationNetwork,
      });

      const result = await OperatorUtils.getReputationNetworkOperators(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_REPUTATION_NETWORK_QUERY(),
        {
          address: stakerAddress,
          role: undefined,
        }
      );
      expect(result).toEqual([mockOperator]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        OperatorUtils.getReputationNetworkOperators(
          ChainId.LOCALHOST,
          stakerAddress
        )
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRewards', () => {
    const invalidAddress = 'InvalidAddress';

    const mockReward: IReward = {
      escrowAddress: ethers.ZeroAddress,
      amount: ethers.parseEther('100'),
    };

    test('should throw an error if an invalid slasher address is provided', async () => {
      await expect(
        OperatorUtils.getRewards(ChainId.LOCALHOST, invalidAddress)
      ).rejects.toThrow(ErrorInvalidSlasherAddressProvided);
    });

    test('should return an array of rewards', async () => {
      vi.spyOn(OperatorUtils, 'getRewards').mockImplementation(() =>
        Promise.resolve([mockReward, mockReward])
      );

      const results = await OperatorUtils.getRewards(
        ChainId.LOCALHOST,
        ethers.ZeroAddress
      );

      expect(results).toEqual([mockReward, mockReward]);
    });
  });
});
