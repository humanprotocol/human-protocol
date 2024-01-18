/* eslint-disable @typescript-eslint/no-explicit-any */
import * as gqlFetch from 'graphql-request';
import { Overrides, Signer, ethers } from 'ethers';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ChainId } from '../src/enums';
import {
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorProviderDoesNotExist,
  ErrorUnsupportedChainID,
} from '../src/error';
import { IAllocation, IReward, ILeader } from '../src/interfaces';
import { StakingClient } from '../src/staking';
import {
  DEFAULT_GAS_PAYER_PRIVKEY,
  FAKE_AMOUNT,
  FAKE_NEGATIVE_AMOUNT,
} from './utils/constants';
import {
  GET_LEADERS_QUERY,
  GET_LEADER_QUERY,
} from '../src/graphql/queries/staking';

vi.mock('graphql-request', () => {
  return {
    default: vi.fn(),
  };
});

vi.mock('../src/init');

describe('StakingClient', () => {
  let stakingClient: any,
    mockProvider: any,
    mockSigner: any,
    mockStakingContract: any,
    mockEscrowFactoryContract: any,
    mockTokenContract: any,
    mockRewardPoolContract: any;

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

    mockStakingContract = {
      stake: vi.fn(),
      unstake: vi.fn(),
      withdraw: vi.fn(),
      slash: vi.fn(),
      allocate: vi.fn(),
      closeAllocation: vi.fn(),
      distributeReward: vi.fn(),
      getRewards: vi.fn(),
      getStaker: vi.fn(),
      getListOfStakers: vi.fn(),
      getAllocation: vi.fn(),
      getAddress: vi.fn().mockResolvedValue(ethers.ZeroAddress),
    };

    mockEscrowFactoryContract = {
      hasEscrow: vi.fn(),
    };

    mockTokenContract = {
      allowance: vi.fn(),
      approve: vi.fn(),
    };

    mockRewardPoolContract = {
      distributeReward: vi.fn(),
    };

    stakingClient = await StakingClient.build(mockSigner);
    stakingClient.stakingContract = mockStakingContract;
    stakingClient.tokenContract = mockTokenContract;
    stakingClient.escrowFactoryContract = mockEscrowFactoryContract;
    stakingClient.rewardPoolContract = mockRewardPoolContract;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('build', () => {
    test('should create a new instance of StakingClient with a Signer', async () => {
      const stakingClient = await StakingClient.build(mockSigner as Signer);

      expect(stakingClient).toBeInstanceOf(StakingClient);
    });

    test('should create a new instance of StakingClient with a Provider', async () => {
      const stakingClient = await StakingClient.build(mockProvider);

      expect(stakingClient).toBeInstanceOf(StakingClient);
    });

    test('should throw an error if Signer provider does not exist', async () => {
      const signer = new ethers.Wallet(DEFAULT_GAS_PAYER_PRIVKEY);

      await expect(StakingClient.build(signer)).rejects.toThrow(
        ErrorProviderDoesNotExist
      );
    });

    test('should throw an error if the chain ID is unsupported', async () => {
      const provider = new ethers.JsonRpcProvider();

      vi.spyOn(provider, 'getNetwork').mockResolvedValue({
        chainId: 1337,
      } as any);

      await expect(StakingClient.build(provider)).rejects.toThrow(
        ErrorUnsupportedChainID
      );
    });
  });

  describe('approveStake', () => {
    const amount = ethers.toBigInt(FAKE_AMOUNT);
    const negativeAmount = ethers.toBigInt(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if the amount is not a bigint', async () => {
      await expect(stakingClient.approveStake('foo')).rejects.toThrow(
        ErrorInvalidStakingValueType
      );
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if the amount is negative', async () => {
      await expect(stakingClient.approveStake(negativeAmount)).rejects.toThrow(
        ErrorInvalidStakingValueSign
      );
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(0);
    });

    test('should not fail and return void if the allowance is sufficient and the approval is successful', async () => {
      stakingClient.isAllowance = vi.fn().mockResolvedValue(true);

      const approveSpy = vi
        .spyOn(mockTokenContract, 'approve')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await expect(await stakingClient.approveStake(amount)).toBeUndefined();
      expect(approveSpy).toBeCalledWith(ethers.ZeroAddress, amount, {});
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(1);
    });

    test('should not fail and return void if the allowance is sufficient and the approval is successful with transaction options', async () => {
      stakingClient.isAllowance = vi.fn().mockResolvedValue(true);

      const approveSpy = vi
        .spyOn(mockTokenContract, 'approve')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await expect(
        await stakingClient.approveStake(amount, txOptions)
      ).toBeUndefined();
      expect(approveSpy).toBeCalledWith(ethers.ZeroAddress, amount, txOptions);
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the approval fails', async () => {
      stakingClient.isAllowance = vi.fn().mockResolvedValue(true);

      mockTokenContract.approve = vi.fn().mockRejectedValue(new Error());

      await expect(stakingClient.approveStake(amount)).rejects.toThrow();
      expect(mockTokenContract.approve).toBeCalledWith(
        ethers.ZeroAddress,
        amount,
        {}
      );
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(1);
    });
  });

  describe('stake', () => {
    const amount = ethers.toBigInt(FAKE_AMOUNT);
    const negativeAmount = ethers.toBigInt(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if amount is not a bigint', async () => {
      await expect(stakingClient.stake('foo')).rejects.toThrow(
        ErrorInvalidStakingValueType
      );
      expect(mockStakingContract.stake).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if amount is negative', async () => {
      await expect(stakingClient.stake(negativeAmount)).rejects.toThrow(
        ErrorInvalidStakingValueSign
      );
      expect(mockStakingContract.stake).toHaveBeenCalledTimes(0);
    });

    test('should call the stake function on the staking contract with the given amount', async () => {
      mockTokenContract.allowance.mockResolvedValueOnce(amount);
      const stakeSpy = vi
        .spyOn(mockStakingContract, 'stake')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await stakingClient.stake(amount);

      expect(stakeSpy).toHaveBeenCalledWith(amount, {});
      expect(stakeSpy).toHaveBeenCalledTimes(1);
    });

    test('should call the stake function on the staking contract with transaction options', async () => {
      mockTokenContract.allowance.mockResolvedValueOnce(amount);
      const stakeSpy = vi
        .spyOn(mockStakingContract, 'stake')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.stake(amount, txOptions);

      expect(stakeSpy).toHaveBeenCalledWith(amount, txOptions);
      expect(stakeSpy).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the stake function on the staking contract fails', async () => {
      mockTokenContract.allowance.mockResolvedValueOnce(amount);

      mockStakingContract.stake.mockRejectedValueOnce(new Error());

      await expect(stakingClient.stake(amount)).rejects.toThrow();
      expect(mockStakingContract.stake).toHaveBeenCalledWith(amount, {});
      expect(mockStakingContract.stake).toHaveBeenCalledTimes(1);
    });
  });

  describe('unstake', () => {
    const amount = ethers.toBigInt(FAKE_AMOUNT);
    const negativeAmount = ethers.toBigInt(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if amount is not a bigint', async () => {
      await expect(stakingClient.unstake('foo')).rejects.toThrow(
        ErrorInvalidStakingValueType
      );
      expect(mockStakingContract.unstake).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if amount is negative', async () => {
      await expect(stakingClient.unstake(negativeAmount)).rejects.toThrow(
        ErrorInvalidStakingValueSign
      );
      expect(mockStakingContract.unstake).toHaveBeenCalledTimes(0);
    });

    test('should call the unstake function on the staking contract with the given amount', async () => {
      const unstakeSpy = vi
        .spyOn(mockStakingContract, 'unstake')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      await stakingClient.unstake(amount);

      expect(unstakeSpy).toHaveBeenCalledWith(amount, {});
      expect(unstakeSpy).toHaveBeenCalledTimes(1);
    });

    test('should call the unstake function on the staking contract with transaction options', async () => {
      const unstakeSpy = vi
        .spyOn(mockStakingContract, 'unstake')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.unstake(amount, txOptions);

      expect(unstakeSpy).toHaveBeenCalledWith(amount, txOptions);
      expect(unstakeSpy).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the unstake function on the staking contract fails', async () => {
      mockStakingContract.unstake.mockRejectedValueOnce(new Error());

      await expect(stakingClient.unstake(amount)).rejects.toThrow();
      expect(mockStakingContract.unstake).toHaveBeenCalledWith(amount, {});
      expect(mockStakingContract.unstake).toHaveBeenCalledTimes(1);
    });
  });

  describe('withdraw', () => {
    test('should call the withdraw method with the correct parameters', async () => {
      mockStakingContract.withdraw.mockResolvedValueOnce();
      const withdrawSpy = vi
        .spyOn(mockStakingContract, 'withdraw')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.withdraw(txOptions);

      expect(withdrawSpy).toHaveBeenCalledWith(txOptions);
      expect(withdrawSpy).toHaveBeenCalledTimes(1);
    });
    test('should call the withdraw method with transaction options', async () => {
      mockStakingContract.withdraw.mockResolvedValueOnce();
      const withdrawSpy = vi
        .spyOn(mockStakingContract, 'withdraw')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await stakingClient.withdraw();

      expect(withdrawSpy).toHaveBeenCalledWith({});
      expect(withdrawSpy).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the withdraw method of the staking contract fails', async () => {
      mockStakingContract.withdraw.mockRejectedValueOnce(new Error());

      await expect(stakingClient.withdraw()).rejects.toThrow();
      expect(mockStakingContract.withdraw).toHaveBeenCalledWith({});
      expect(mockStakingContract.withdraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('slash', () => {
    const amount = ethers.toBigInt(FAKE_AMOUNT);
    const negativeAmount = ethers.toBigInt(FAKE_NEGATIVE_AMOUNT);
    const invalidAddress = 'InvalidAddress';

    test('throws an error if amount is not a bigint', async () => {
      await expect(
        stakingClient.slash(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          'foo'
        )
      ).rejects.toThrow(ErrorInvalidStakingValueType);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is negative', async () => {
      await expect(
        stakingClient.slash(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          negativeAmount
        )
      ).rejects.toThrow(ErrorInvalidStakingValueSign);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if slasher address is invalid', async () => {
      await expect(
        stakingClient.slash(
          invalidAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          amount
        )
      ).rejects.toThrow(ErrorInvalidSlasherAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if staker address is invalid', async () => {
      await expect(
        stakingClient.slash(
          ethers.ZeroAddress,
          invalidAddress,
          ethers.ZeroAddress,
          amount
        )
      ).rejects.toThrow(ErrorInvalidStakerAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is invalid', async () => {
      await expect(
        stakingClient.slash(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          invalidAddress,
          amount
        )
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.slash(
          invalidAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          amount
        )
      ).rejects.toThrow(ErrorInvalidSlasherAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if slashing fails', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.slash.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.slash(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          amount
        )
      ).rejects.toThrow();

      expect(mockStakingContract.slash).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        amount,
        {}
      );
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(1);
    });

    test('calls the staking contract to slash the given amount', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const slashSpy = vi
        .spyOn(mockStakingContract, 'slash')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await stakingClient.slash(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        amount
      );

      expect(slashSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        amount,
        {}
      );
      expect(slashSpy).toHaveBeenCalledTimes(1);
    });

    test('calls the staking contract to slash the given amount with transaction options', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const slashSpy = vi
        .spyOn(mockStakingContract, 'slash')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.slash(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        amount,
        txOptions
      );

      expect(slashSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        amount,
        txOptions
      );
      expect(slashSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('allocate', () => {
    const amount = ethers.toBigInt(FAKE_AMOUNT);
    const negativeAmount = ethers.toBigInt(FAKE_NEGATIVE_AMOUNT);
    const invalidAddress = 'InvalidAddress';

    test('throws an error if escrow address is invalid', async () => {
      await expect(
        stakingClient.allocate(invalidAddress, amount)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is not a bigint', async () => {
      await expect(
        stakingClient.allocate(ethers.ZeroAddress, 'foo')
      ).rejects.toThrow(ErrorInvalidStakingValueType);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is negative', async () => {
      await expect(
        stakingClient.allocate(ethers.ZeroAddress, negativeAmount)
      ).rejects.toThrow(ErrorInvalidStakingValueSign);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.allocate(ethers.ZeroAddress, amount)
      ).rejects.toThrow();
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('should call the allocate method with the correct parameters', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const allocateSpy = vi
        .spyOn(mockStakingContract, 'allocate')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));
      await stakingClient.allocate(ethers.ZeroAddress, amount);

      expect(allocateSpy).toHaveBeenCalledWith(ethers.ZeroAddress, amount, {});
      expect(allocateSpy).toHaveBeenCalledTimes(1);
    });

    test('should call the allocate method with with transaction options', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const allocateSpy = vi
        .spyOn(mockStakingContract, 'allocate')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.allocate(ethers.ZeroAddress, amount, txOptions);

      expect(allocateSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        amount,
        txOptions
      );
      expect(allocateSpy).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the allocate method fails', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.allocate.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.allocate(ethers.ZeroAddress, amount)
      ).rejects.toThrow();
      expect(mockStakingContract.allocate).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        amount,
        {}
      );
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(1);
    });
  });

  describe('closeAllocation', () => {
    const invalidAddress = 'InvalidAddress';

    test('should throws an error if escrow address is invalid', async () => {
      await expect(
        stakingClient.closeAllocation(invalidAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.closeAllocation(ethers.ZeroAddress)
      ).rejects.toThrow();
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(0);
    });

    test('should throw an error when stakingContract.closeAllocation throws an error', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.closeAllocation.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.closeAllocation(ethers.ZeroAddress)
      ).rejects.toThrow();

      expect(mockStakingContract.closeAllocation).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        {}
      );
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(1);
    });

    test('should call the closeAllocation method with the correct parameters', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const closeAllocationSpy = vi
        .spyOn(mockStakingContract, 'closeAllocation')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await stakingClient.closeAllocation(ethers.ZeroAddress);

      expect(closeAllocationSpy).toHaveBeenCalledWith(ethers.ZeroAddress, {});
      expect(closeAllocationSpy).toHaveBeenCalledTimes(1);
    });

    test('should call the closeAllocation method with transaction options', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const closeAllocationSpy = vi
        .spyOn(mockStakingContract, 'closeAllocation')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.closeAllocation(ethers.ZeroAddress, txOptions);

      expect(closeAllocationSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        txOptions
      );
      expect(closeAllocationSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('distributeReward', () => {
    const invalidAddress = 'InvalidAddress';

    test('should throw an error if an invalid escrow address is provided', async () => {
      await expect(
        stakingClient.distributeReward(invalidAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockRewardPoolContract.distributeReward).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.distributeReward(ethers.ZeroAddress)
      ).rejects.toThrow();
      expect(mockRewardPoolContract.distributeReward).toHaveBeenCalledTimes(0);
    });

    test('should call distributeReward on the reward pool contract', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const distributeRewardSpy = vi
        .spyOn(mockRewardPoolContract, 'distributeReward')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      await stakingClient.distributeReward(ethers.ZeroAddress);

      expect(distributeRewardSpy).toHaveBeenCalledWith(ethers.ZeroAddress, {});
      expect(distributeRewardSpy).toHaveBeenCalledTimes(1);
    });

    test('should call distributeReward on the reward pool contract with transaction options', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      const distributeRewardSpy = vi
        .spyOn(mockRewardPoolContract, 'distributeReward')
        .mockImplementation(() => ({
          wait: vi.fn().mockResolvedValue(true),
        }));

      const txOptions: Overrides = { gasLimit: 45000 };

      await stakingClient.distributeReward(ethers.ZeroAddress, txOptions);

      expect(distributeRewardSpy).toHaveBeenCalledWith(
        ethers.ZeroAddress,
        txOptions
      );
      expect(distributeRewardSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLeader', () => {
    const stakerAddress = ethers.ZeroAddress;
    const invalidAddress = 'InvalidAddress';

    const mockLeader: ILeader = {
      id: stakerAddress,
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

      const result = await stakingClient.getLeader(stakerAddress);

      expect(gqlFetchSpy).toHaveBeenCalledWith('', GET_LEADER_QUERY, {
        address: stakerAddress,
      });
      expect(result).toEqual(mockLeader);
    });

    test('should throw an error for an invalid staker address', async () => {
      await expect(stakingClient.getLeader(invalidAddress)).rejects.toThrow(
        ErrorInvalidStakerAddressProvided
      );
      expect(mockStakingContract.getStaker).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if the gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(stakingClient.getLeader(stakerAddress)).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLeaders', () => {
    const stakerAddress = ethers.ZeroAddress;

    const mockLeader: ILeader = {
      id: stakerAddress,
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
      const filter = { role: 'role' };

      const result = await stakingClient.getLeaders(filter);

      expect(gqlFetchSpy).toHaveBeenCalledWith(
        '',
        GET_LEADERS_QUERY(filter),
        filter
      );
      expect(result).toEqual([mockLeader, mockLeader]);
    });

    test('should throw an error if gql fetch fails', async () => {
      const gqlFetchSpy = vi
        .spyOn(gqlFetch, 'default')
        .mockRejectedValueOnce(new Error('Error'));

      await expect(stakingClient.getLeaders()).rejects.toThrow();
      expect(gqlFetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllocation', () => {
    const invalidAddress = 'InvalidAddress';

    test('should throw an error for invalid escrow address', async () => {
      await expect(stakingClient.getAllocation(invalidAddress)).rejects.toThrow(
        ErrorInvalidEscrowAddressProvided
      );
      expect(mockStakingContract.getAllocation).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.getAllocation(ethers.ZeroAddress)
      ).rejects.toThrow();
      expect(mockStakingContract.getAllocation).toHaveBeenCalledTimes(0);
    });

    test('should return allocation information', async () => {
      const mockAllocation: IAllocation = {
        escrowAddress: ethers.ZeroAddress,
        staker: ethers.ZeroAddress,
        tokens: ethers.parseEther('100'),
        createdAt: ethers.parseEther('100'),
        closedAt: ethers.parseEther('100'),
      };
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.getAllocation.mockResolvedValueOnce(mockAllocation);

      const result = await stakingClient.getAllocation(ethers.ZeroAddress);
      expect(result).toEqual(mockAllocation);
      expect(mockStakingContract.getAllocation).toHaveBeenCalledWith(
        ethers.ZeroAddress
      );
      expect(mockStakingContract.getAllocation).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the allocation data cannot be retrieved', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.getAllocation.mockRejectedValue(new Error());
      await expect(
        stakingClient.getAllocation(ethers.ZeroAddress)
      ).rejects.toThrow();
    });
  });

  describe('getRewards', () => {
    const invalidAddress = 'InvalidAddress';

    const mockReward: IReward = {
      escrowAddress: ethers.ZeroAddress,
      amount: ethers.parseEther('100'),
    };

    test('should throw an error if an invalid escrow address is provided', async () => {
      await expect(stakingClient.getRewards(invalidAddress)).rejects.toThrow(
        ErrorInvalidSlasherAddressProvided
      );
      expect(mockStakingContract.getRewards).toHaveBeenCalledTimes(0);
    });

    test('should return an array of rewards', async () => {
      vi.spyOn(stakingClient, 'getRewards').mockImplementation(() =>
        Promise.resolve([mockReward, mockReward])
      );

      const results = await stakingClient.getRewards(ethers.ZeroAddress);

      expect(results).toEqual([mockReward, mockReward]);
    });
  });
});
