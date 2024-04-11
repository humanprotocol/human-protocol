/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from 'ethers';
import * as gqlFetch from 'graphql-request';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { NETWORKS } from '../src/constants';
import {
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
} from '../src/error';
import {
  GET_LEADERS_QUERY,
  GET_LEADER_QUERY,
  GET_REPUTATION_NETWORK_QUERY,
} from '../src/graphql/queries/operator';
import { ILeader, IReward } from '../src/interfaces';
import { OperatorUtils } from '../src/operator';
import { ChainId } from '../src/enums';
import { NetworkData } from '../src/types';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

describe('OperatorUtils', () => {
  let operatorUtils: any,
    mockProvider: any,
    mockSigner: any,
    network: NetworkData | undefined,
    mockKVStoreContract: any;

  beforeEach(async () => {
    mockProvider = {
      provider: {
        getNetwork: vi.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
      },
    };
    mockSigner = {
      provider: mockProvider.provider,
      getAddress: vi.fn().mockResolvedValue(ethers.ZeroAddress),
    };
    mockKVStoreContract = {
      set: vi.fn(),
      setBulk: vi.fn(),
      get: vi.fn(),
      address: network?.kvstoreAddress,
    };

    operatorUtils = await OperatorUtils.build(mockSigner);
    operatorUtils.kvStoreContract = mockKVStoreContract;
  });

  describe('getLeader', () => {
    const stakerAddress = ethers.ZeroAddress;
    const invalidAddress = 'InvalidAddress';
    const mockLeader: ILeader = {
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
    };

    test('should return staker information', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leader: mockLeader,
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

    const mockLeader: ILeader = {
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
    };

    test('should return an array of stakers', async () => {
      const gqlFetchSpy = vi.spyOn(gqlFetch, 'default').mockResolvedValueOnce({
        leaders: [mockLeader, mockLeader],
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

    test('should return reputation network operators with url and job_types', async () => {
      vi.spyOn(gqlFetch, 'default').mockResolvedValue({
        reputationNetwork: {
          operators: [
            {
              address: '0x0000000000000000000000000000000000000001',
              role: 'Job Launcher',
              job_types: ['JobType1', 'JobType2'],
              url: 'http://example.com',
            },
          ],
        },
      });

      const result = await operatorUtils.getReputationNetworkOperators(
        ChainId.LOCALHOST,
        stakerAddress
      );

      expect(gqlFetch.default).toHaveBeenCalledWith(
        NETWORKS[ChainId.LOCALHOST]?.subgraphUrl,
        GET_REPUTATION_NETWORK_QUERY(),
        {
          address: stakerAddress,
          role: undefined,
        }
      );

      const mockOperator = {
        address: '0x0000000000000000000000000000000000000001',
        job_types: [],
        role: 'Job Launcher',
        url: undefined,
      };

      expect(result).toEqual([mockOperator]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(
        operatorUtils.getReputationNetworkOperators(
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
