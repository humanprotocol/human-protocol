vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

import { ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi } from 'vitest';
import { NETWORKS, Role } from '../src/constants';
import { ChainId, OrderDirection } from '../src/enums';
import {
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
} from '../src/error';
import {
  GET_LEADER_QUERY,
  GET_LEADERS_QUERY,
  GET_REPUTATION_NETWORK_QUERY,
} from '../src/graphql/queries/operator';
import { IOperator, IOperatorsFilter, IReward } from '../src/interfaces';
import { OperatorUtils } from '../src/operator';
import { IOperatorSubgraph, IReputationNetworkSubgraph } from '../src/graphql';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

const stakerAddress = ethers.ZeroAddress;
const invalidAddress = 'InvalidAddress';

describe('OperatorUtils', () => {
  const mockOperatorSubgraph: IOperatorSubgraph = {
    id: stakerAddress,
    address: stakerAddress,
    amountJobsProcessed: ethers.parseEther('25').toString(),
    jobTypes: ['type1', 'type2'],
    registrationNeeded: true,
    registrationInstructions: 'www.google.com',
    website: 'www.google.com',
    reputationNetworks: [
      {
        address: '0x01',
      },
    ],
    staker: {
      stakedAmount: ethers.parseEther('100').toString(),
      lockedAmount: ethers.parseEther('25').toString(),
      lockedUntilTimestamp: '0',
      withdrawnAmount: ethers.parseEther('25').toString(),
      slashedAmount: ethers.parseEther('25').toString(),
      lastDepositTimestamp: '0',
    },
    category: null,
    fee: null,
    name: null,
    publicKey: null,
    role: null,
    url: null,
    webhookUrl: null,
  };
  const operator: IOperator = {
    id: stakerAddress,
    address: stakerAddress,
    amountJobsProcessed: ethers.parseEther('25'),
    registrationNeeded: true,
    registrationInstructions: 'www.google.com',
    website: 'www.google.com',
    jobTypes: ['type1', 'type2'],
    reputationNetworks: ['0x01'],
    chainId: ChainId.LOCALHOST,
    stakedAmount: ethers.parseEther('100'),
    lockedAmount: ethers.parseEther('25'),
    lockedUntilTimestamp: 0,
    withdrawnAmount: ethers.parseEther('25'),
    slashedAmount: ethers.parseEther('25'),
    role: null,
    fee: null,
    publicKey: null,
    webhookUrl: null,
    url: null,
    name: null,
    category: null,
  };

  describe('getOperator', () => {
    test('should return staker information', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operator: mockOperatorSubgraph,
      });

      const result = await OperatorUtils.getOperator(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        },
        undefined
      );
      expect(result).toEqual(operator);
    });

    test('should return staker information when jobTypes is undefined', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operator: { ...mockOperatorSubgraph, jobTypes: undefined },
      });

      const result = await OperatorUtils.getOperator(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        },
        undefined
      );
      expect(result).toEqual({ ...operator, jobTypes: [] });
    });

    test('should return staker information when jobTypes is a string', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operator: { ...mockOperatorSubgraph, jobTypes: 'type1,type2,type3' },
      });

      const result = await OperatorUtils.getOperator(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        },
        undefined
      );
      expect(result).toEqual({
        ...operator,
        jobTypes: ['type1', 'type2', 'type3'],
      });
    });

    test('should throw an error for an invalid staker address', async () => {
      await expect(
        OperatorUtils.getOperator(ChainId.LOCALHOST, invalidAddress)
      ).rejects.toThrow(ErrorInvalidStakerAddressProvided);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        OperatorUtils.getOperator(ChainId.LOCALHOST, stakerAddress)
      ).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return empty data', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operator: null,
      });

      const result = await OperatorUtils.getOperator(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADER_QUERY,
        {
          address: stakerAddress,
        },
        undefined
      );
      expect(result).toEqual(null);
    });
  });

  describe('getOperators', () => {
    test('should return an array of stakers', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [mockOperatorSubgraph, mockOperatorSubgraph],
      });
      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
        roles: [Role.ExchangeOracle],
      };
      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      expect(result).toEqual([operator, operator]);
    });

    test('should apply default values when first is negative', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [mockOperatorSubgraph],
      });

      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
        first: -5, // Invalid value
        skip: 0,
      };

      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10, // Default value
          skip: 0,
        },
        undefined
      );
      expect(result).toEqual([operator]);
    });

    test('should apply default values when skip is negative', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [mockOperatorSubgraph],
      });

      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
        first: 10,
        skip: -3, // Invalid value
      };

      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0, // Default value
        },
        undefined
      );
      expect(result).toEqual([operator]);
    });

    test('should apply default values when first and skip are undefined', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [mockOperatorSubgraph],
      });

      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
      };

      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10, // Default value
          skip: 0, // Default value
        },
        undefined
      );
      expect(result).toEqual([operator]);
    });

    test('should return an array of stakers when jobTypes is a string', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [
          { ...mockOperatorSubgraph, jobTypes: 'type1,type2,type3' },
          { ...mockOperatorSubgraph, jobTypes: 'type1,type2,type3' },
        ],
      });

      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
        roles: [Role.ExchangeOracle],
      };

      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );
      expect(result).toEqual([
        { ...operator, jobTypes: ['type1', 'type2', 'type3'] },
        { ...operator, jobTypes: ['type1', 'type2', 'type3'] },
      ]);
    });

    test('should return an array of stakers when jobTypes is undefined', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: [
          { ...mockOperatorSubgraph, jobTypes: undefined },
          { ...mockOperatorSubgraph, jobTypes: undefined },
        ],
      });
      const filter: IOperatorsFilter = {
        chainId: ChainId.LOCALHOST,
        roles: [Role.ExchangeOracle],
      };
      const result = await OperatorUtils.getOperators(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_LEADERS_QUERY(filter),
        {
          minStakedAmount: filter?.minStakedAmount,
          roles: filter?.roles,
          orderBy: filter?.orderBy,
          orderDirection: OrderDirection.DESC,
          first: 10,
          skip: 0,
        },
        undefined
      );

      expect(result).toEqual([
        { ...operator, jobTypes: [] },
        { ...operator, jobTypes: [] },
      ]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const filter = {
        chainId: ChainId.LOCALHOST,
        roles: [Role.ExchangeOracle],
      };

      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(OperatorUtils.getOperators(filter)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });

    test('should return empty data', async () => {
      const filter = {
        chainId: ChainId.LOCALHOST,
        roles: [Role.ExchangeOracle],
      };

      vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        operators: null,
      });

      const results = await OperatorUtils.getOperators(filter);
      expect(results).toEqual([]);
    });
  });

  describe('getReputationNetworkOperators', () => {
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
        },
        undefined
      );
      expect(result).toEqual([operator]);
    });

    test('should return empty data ', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: null,
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
        },
        undefined
      );
      expect(result).toEqual([]);
    });

    test('should return reputation network operators when jobTypes is undefined', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: {
          ...mockReputationNetwork,
          operators: [{ ...mockOperatorSubgraph, jobTypes: undefined }],
        },
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
        },
        undefined
      );
      expect(result).toEqual([{ ...operator, jobTypes: [] }]);
    });

    test('should return reputation network operators when jobTypes is a string', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        reputationNetwork: {
          ...mockReputationNetwork,
          operators: [
            { ...mockOperatorSubgraph, jobTypes: 'type1,type2,type3' },
          ],
        },
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
        },
        undefined
      );
      expect(result).toEqual([
        { ...operator, jobTypes: ['type1', 'type2', 'type3'] },
      ]);
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

    test('should return empty data', async () => {
      vi.spyOn(OperatorUtils, 'getRewards').mockImplementation(() =>
        Promise.resolve([])
      );

      const results = await OperatorUtils.getRewards(
        ChainId.LOCALHOST,
        ethers.ZeroAddress
      );

      expect(results).toEqual([]);
    });
  });
});
