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
  ILeadersFilter,
  ILeaderSubgraph,
  IOperator,
  IOperatorSubgraph,
  IReputationNetworkSubgraph,
  IReward,
} from '../src/interfaces';
import { OperatorUtils } from '../src/operator';
import { ChainId, OrderDirection } from '../src/enums';

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
      address: stakerAddress,
      amountStaked: ethers.parseEther('100'),
      amountLocked: ethers.parseEther('25'),
      lockedUntilTimestamp: ethers.toBigInt(0),
      amountWithdrawn: ethers.parseEther('25'),
      amountSlashed: ethers.parseEther('25'),
      reward: ethers.parseEther('25'),
      amountJobsProcessed: ethers.parseEther('25'),
      jobTypes: 'type1,type2',
      registrationNeeded: true,
      registrationInstructions: 'www.google.com',
      website: 'www.google.com',
      reputationNetworks: [
        {
          address: '0x01',
        },
      ],
    };

    const mockLeader: ILeader = {
      ...mockLeaderSubgraph,
      jobTypes: ['type1', 'type2'],
      reputationNetworks: ['0x01'],
      chainId: ChainId.SEPOLIA,
    };

    test('should return staker information', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: mockLeaderSubgraph,
      });

      const result = await OperatorUtils.getLeader(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        }
      );
      expect(result).toEqual(mockLeader);
    });

    test('should return staker information when jobTypes is undefined', async () => {
      mockLeaderSubgraph.jobTypes = undefined;
      const mockLeader: ILeader = {
        ...mockLeaderSubgraph,
        jobTypes: [],
        reputationNetworks: ['0x01'],
        chainId: ChainId.SEPOLIA,
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: mockLeaderSubgraph,
      });

      const result = await OperatorUtils.getLeader(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        }
      );
      expect(result).toEqual(mockLeader);
    });

    test('should return staker information when jobTypes is array', async () => {
      mockLeaderSubgraph.jobTypes = ['type1', 'type2', 'type3'] as any;
      const mockLeader: ILeader = {
        ...mockLeaderSubgraph,
        jobTypes: ['type1', 'type2', 'type3'],
        reputationNetworks: ['0x01'],
        chainId: ChainId.SEPOLIA,
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: mockLeaderSubgraph,
      });

      const result = await OperatorUtils.getLeader(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        }
      );
      expect(result).toEqual(mockLeader);
    });

    test('should throw an error for an invalid staker address', async () => {
      await expect(
        OperatorUtils.getLeader(ChainId.SEPOLIA, invalidAddress)
      ).rejects.toThrow(ErrorInvalidStakerAddressProvided);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        OperatorUtils.getLeader(ChainId.SEPOLIA, stakerAddress)
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return empty data', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: null,
      });

      const result = await OperatorUtils.getLeader(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        }
      );
      expect(result).toEqual(null);
    });
  });

  describe('getLeaders', () => {
    const stakerAddress = ethers.ZeroAddress;

    const mockLeaderSubgraph: ILeaderSubgraph = {
      id: stakerAddress,
      address: stakerAddress,
      amountStaked: ethers.parseEther('100'),
      amountLocked: ethers.parseEther('25'),
      lockedUntilTimestamp: ethers.toBigInt(0),
      amountWithdrawn: ethers.parseEther('25'),
      amountSlashed: ethers.parseEther('25'),
      reward: ethers.parseEther('25'),
      amountJobsProcessed: ethers.parseEther('25'),
      jobTypes: 'type1,type2',
      registrationNeeded: true,
      registrationInstructions: 'www.google.com',
      website: 'www.google.com',
      reputationNetworks: [
        {
          address: '0x01',
        },
      ],
      name: 'Alice',
      category: 'machine_learning',
    };

    const mockLeader: ILeader = {
      ...mockLeaderSubgraph,
      jobTypes: ['type1', 'type2'],
      reputationNetworks: ['0x01'],
      chainId: ChainId.SEPOLIA,
    };

    test('should return an array of stakers', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph, mockLeaderSubgraph],
      });
      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
        roles: [Role.ExchangeOracle],
      };
      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        }
      );
      expect(result).toEqual([mockLeader, mockLeader]);
    });

    test('should apply default values when first is negative', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph],
      });

      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
        first: -5, // Invalid value
        skip: 0,
      };

      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10, // Default value
          skip: 0,
        }
      );
      expect(result).toEqual([mockLeader]);
    });

    test('should apply default values when skip is negative', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph],
      });

      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
        first: 10,
        skip: -3, // Invalid value
      };

      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0, // Default value
        }
      );
      expect(result).toEqual([mockLeader]);
    });

    test('should apply default values when first and skip are undefined', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph],
      });

      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
      };

      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10, // Default value
          skip: 0, // Default value
        }
      );
      expect(result).toEqual([mockLeader]);
    });

    test('should return an array of stakers when jobTypes is undefined', async () => {
      mockLeaderSubgraph.jobTypes = undefined;
      const mockLeader: ILeader = {
        ...mockLeaderSubgraph,
        jobTypes: [],
        reputationNetworks: ['0x01'],
        chainId: ChainId.SEPOLIA,
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph, mockLeaderSubgraph],
      });
      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
        roles: [Role.ExchangeOracle],
      };
      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        }
      );

      expect(result).toEqual([mockLeader, mockLeader]);
    });

    test('should return an array of stakers when jobTypes is array', async () => {
      mockLeaderSubgraph.jobTypes = ['type1', 'type2', 'type3'] as any;
      const mockLeader: ILeader = {
        ...mockLeaderSubgraph,
        jobTypes: ['type1', 'type2', 'type3'],
        reputationNetworks: ['0x01'],
        chainId: ChainId.SEPOLIA,
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeaderSubgraph, mockLeaderSubgraph],
      });

      const filter: ILeadersFilter = {
        chainId: ChainId.SEPOLIA,
        roles: [Role.ExchangeOracle],
      };

      const result = await OperatorUtils.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minAmountStaked: filter?.minAmountStaked,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        }
      );
      expect(result).toEqual([mockLeader, mockLeader]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const filter = {
        chainId: ChainId.SEPOLIA,
        roles: [Role.ExchangeOracle],
      };

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(OperatorUtils.getLeaders(filter)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return empty data', async () => {
      const filter = {
        chainId: ChainId.SEPOLIA,
        roles: [Role.ExchangeOracle],
      };

      vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: null,
      });

      const results = await OperatorUtils.getLeaders(filter);
      expect(results).toEqual([]);
    });
  });

  describe('getReputationNetworkOperators', () => {
    const stakerAddress = ethers.ZeroAddress;
    const mockOperatorSubgraph: IOperatorSubgraph = {
      address: '0x0000000000000000000000000000000000000001',
      role: Role.JobLauncher,
      url: 'www.google.com',
      jobTypes: 'type1,type2',
      registrationNeeded: true,
      registrationInstructions: 'www.google.com',
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
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_REPUTATION_NETWORK_QUERY(),
        {
          address: stakerAddress,
          role: undefined,
        }
      );
      expect(result).toEqual([mockOperator]);
    });

    test('should return empty data ', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: null,
      });

      const result = await OperatorUtils.getReputationNetworkOperators(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_REPUTATION_NETWORK_QUERY(),
        {
          address: stakerAddress,
          role: undefined,
        }
      );
      expect(result).toEqual([]);
    });

    test('should return reputation network operators when jobTypes is undefined', async () => {
      mockOperatorSubgraph.jobTypes = undefined;
      const mockOperator: IOperator = {
        ...mockOperatorSubgraph,
        jobTypes: [],
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: mockReputationNetwork,
      });

      const result = await OperatorUtils.getReputationNetworkOperators(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
        GET_REPUTATION_NETWORK_QUERY(),
        {
          address: stakerAddress,
          role: undefined,
        }
      );
      expect(result).toEqual([mockOperator]);
    });

    test('should return reputation network operators when jobTypes is array', async () => {
      mockOperatorSubgraph.jobTypes = ['type1', 'type2', 'type3'] as any;
      const mockOperator: IOperator = {
        ...mockOperatorSubgraph,
        jobTypes: ['type1', 'type2', 'type3'],
      };

      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: mockReputationNetwork,
      });

      const result = await OperatorUtils.getReputationNetworkOperators(
        ChainId.SEPOLIA,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.SEPOLIA]?.subgraphUrl,
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
          ChainId.SEPOLIA,
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
        OperatorUtils.getRewards(ChainId.SEPOLIA, invalidAddress)
      ).rejects.toThrow(ErrorInvalidSlasherAddressProvided);
    });

    test('should return an array of rewards', async () => {
      vi.spyOn(OperatorUtils, 'getRewards').mockImplementation(() =>
        Promise.resolve([mockReward, mockReward])
      );

      const results = await OperatorUtils.getRewards(
        ChainId.SEPOLIA,
        ethers.ZeroAddress
      );

      expect(results).toEqual([mockReward, mockReward]);
    });

    test('should return empty data', async () => {
      vi.spyOn(OperatorUtils, 'getRewards').mockImplementation(() =>
        Promise.resolve([])
      );

      const results = await OperatorUtils.getRewards(
        ChainId.SEPOLIA,
        ethers.ZeroAddress
      );

      expect(results).toEqual([]);
    });
  });
});
