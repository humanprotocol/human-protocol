import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ethers, BigNumber } from 'ethers';
import { StakingClient } from '../src/staking';
import {
  FAKE_AMOUNT,
  FAKE_BLOCK_NUMBER,
  FAKE_NEGATIVE_AMOUNT,
  FAKE_NETWORK,
  FAKE_TRANSACTION_CONFIRMATIONS,
  FAKE_TRANSACTION_HASH,
} from './utils/constants';
import {
  ErrorInvalidEscrowAddressProvided,
  ErrorInvalidSlasherAddressProvided,
  ErrorInvalidStakerAddressProvided,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
} from '../src/error';
import { InitClient } from '../src/init';
import { IAllocation, IReward, IStaker } from '../src/interfaces';

vi.mock('../src/init');

describe('StakingClient', () => {
  const provider = new ethers.providers.JsonRpcProvider();
  let stakingClient: any,
    mockSigner: any,
    mockStakingContract: any,
    mockRewardPoolContract: any,
    mockEscrowFactoryContract: any,
    mockTokenContract: any;

  beforeEach(async () => {
    mockSigner = {
      ...provider.getSigner(),
      getAddress: vi.fn().mockReturnValue(ethers.constants.AddressZero),
    };

    mockStakingContract = {
      stake: vi.fn(),
      unstake: vi.fn(),
      withdraw: vi.fn(),
      slash: vi.fn(),
      allocate: vi.fn(),
      closeAllocation: vi.fn(),
      distributeRewards: vi.fn(),
      getRewards: vi.fn(),
      getStaker: vi.fn(),
      getListOfStakers: vi.fn(),
      getAllocation: vi.fn(),
      rewardPool: vi.fn().mockResolvedValueOnce(ethers.constants.AddressZero),
      address: FAKE_NETWORK.stakingAddress,
    };

    mockRewardPoolContract = {
      distributeRewards: vi.fn(),
      getRewards: vi.fn(),
      address: ethers.constants.AddressZero,
    };

    mockEscrowFactoryContract = {
      hasEscrow: vi.fn(),
    };

    mockTokenContract = {
      allowance: vi.fn(),
      approve: vi.fn(),
    };

    const getClientParamsMock = InitClient.getParams as jest.Mock;
    getClientParamsMock.mockResolvedValue({
      signerOrProvider: mockSigner,
      network: FAKE_NETWORK,
    });

    stakingClient = new StakingClient(await InitClient.getParams(mockSigner));

    stakingClient.stakingContract = mockStakingContract;
    stakingClient.tokenContract = mockTokenContract;
    stakingClient.escrowFactoryContract = mockEscrowFactoryContract;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('approveStake', () => {
    const amount = BigNumber.from(FAKE_AMOUNT);
    const negativeAmount = BigNumber.from(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if the amount is not a BigNumber', async () => {
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

      mockTokenContract.approve = vi.fn().mockResolvedValue({
        hash: FAKE_TRANSACTION_HASH,
        blockNumber: FAKE_BLOCK_NUMBER,
        confirmations: FAKE_TRANSACTION_CONFIRMATIONS,
      });

      await expect(stakingClient.approveStake(amount)).resolves.toBeUndefined();
      expect(mockTokenContract.approve).toBeCalledWith(
        ethers.constants.AddressZero,
        amount
      );
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the approval fails', async () => {
      stakingClient.isAllowance = vi.fn().mockResolvedValue(true);

      mockTokenContract.approve = vi.fn().mockRejectedValue(new Error());

      await expect(stakingClient.approveStake(amount)).rejects.toThrow();
      expect(mockTokenContract.approve).toBeCalledWith(
        ethers.constants.AddressZero,
        amount
      );
      expect(mockTokenContract.approve).toHaveBeenCalledTimes(1);
    });
  });

  describe('stake', () => {
    const amount = BigNumber.from(FAKE_AMOUNT);
    const negativeAmount = BigNumber.from(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if amount is not a BigNumber', async () => {
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

      await stakingClient.stake(amount);

      expect(mockStakingContract.stake).toHaveBeenCalledWith(amount);
      expect(mockStakingContract.stake).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the stake function on the staking contract fails', async () => {
      mockTokenContract.allowance.mockResolvedValueOnce(amount);

      mockStakingContract.stake.mockRejectedValueOnce(new Error());

      await expect(stakingClient.stake(amount)).rejects.toThrow();
      expect(mockStakingContract.stake).toHaveBeenCalledWith(amount);
      expect(mockStakingContract.stake).toHaveBeenCalledTimes(1);
    });
  });

  describe('unstake', () => {
    const amount = BigNumber.from(FAKE_AMOUNT);
    const negativeAmount = BigNumber.from(FAKE_NEGATIVE_AMOUNT);

    test('should throw an error if amount is not a BigNumber', async () => {
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
      await stakingClient.unstake(amount);

      expect(mockStakingContract.unstake).toHaveBeenCalledWith(amount);
      expect(mockStakingContract.unstake).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the unstake function on the staking contract fails', async () => {
      mockStakingContract.unstake.mockRejectedValueOnce(new Error());

      await expect(stakingClient.unstake(amount)).rejects.toThrow();
      expect(mockStakingContract.unstake).toHaveBeenCalledWith(amount);
      expect(mockStakingContract.unstake).toHaveBeenCalledTimes(1);
    });
  });

  describe('withdraw', () => {
    test('should call the withdraw method with the correct parameters', async () => {
      mockStakingContract.withdraw.mockResolvedValueOnce();

      await stakingClient.withdraw();

      expect(mockStakingContract.withdraw).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the withdraw method of the staking contract fails', async () => {
      mockStakingContract.withdraw.mockRejectedValueOnce(new Error());

      await expect(stakingClient.withdraw()).rejects.toThrow();
      expect(mockStakingContract.withdraw).toHaveBeenCalledTimes(1);
    });
  });

  describe('slash', () => {
    const amount = BigNumber.from(FAKE_AMOUNT);
    const negativeAmount = BigNumber.from(FAKE_NEGATIVE_AMOUNT);
    const invalidAddress = 'InvalidAddress';

    test('throws an error if amount is not a BigNumber', async () => {
      await expect(
        stakingClient.slash(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          'foo'
        )
      ).rejects.toThrow(ErrorInvalidStakingValueType);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is negative', async () => {
      await expect(
        stakingClient.slash(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          negativeAmount
        )
      ).rejects.toThrow(ErrorInvalidStakingValueSign);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if slasher address is invalid', async () => {
      await expect(
        stakingClient.slash(
          invalidAddress,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          amount
        )
      ).rejects.toThrow(ErrorInvalidSlasherAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if staker address is invalid', async () => {
      await expect(
        stakingClient.slash(
          ethers.constants.AddressZero,
          invalidAddress,
          ethers.constants.AddressZero,
          amount
        )
      ).rejects.toThrow(ErrorInvalidStakerAddressProvided);
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is invalid', async () => {
      await expect(
        stakingClient.slash(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
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
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
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
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          ethers.constants.AddressZero,
          amount
        )
      ).rejects.toThrow();

      expect(mockStakingContract.slash).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        amount
      );
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(1);
    });

    test('calls the staking contract to slash the given amount', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.slash.mockResolvedValueOnce();

      await stakingClient.slash(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        amount
      );

      expect(mockStakingContract.slash).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        ethers.constants.AddressZero,
        amount
      );
      expect(mockStakingContract.slash).toHaveBeenCalledTimes(1);
    });
  });

  describe('allocate', () => {
    const amount = BigNumber.from(FAKE_AMOUNT);
    const negativeAmount = BigNumber.from(FAKE_NEGATIVE_AMOUNT);
    const invalidAddress = 'InvalidAddress';

    test('throws an error if escrow address is invalid', async () => {
      await expect(
        stakingClient.allocate(invalidAddress, amount)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is not a BigNumber', async () => {
      await expect(
        stakingClient.allocate(ethers.constants.AddressZero, 'foo')
      ).rejects.toThrow(ErrorInvalidStakingValueType);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if amount is negative', async () => {
      await expect(
        stakingClient.allocate(ethers.constants.AddressZero, negativeAmount)
      ).rejects.toThrow(ErrorInvalidStakingValueSign);
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.allocate(ethers.constants.AddressZero, amount)
      ).rejects.toThrow();
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(0);
    });

    test('should call the allocate method with the correct parameters', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      await stakingClient.allocate(ethers.constants.AddressZero, amount);

      expect(mockStakingContract.allocate).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        amount
      );
      expect(mockStakingContract.allocate).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the allocate method fails', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.allocate.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.allocate(ethers.constants.AddressZero, amount)
      ).rejects.toThrow();
      expect(mockStakingContract.allocate).toHaveBeenCalledWith(
        ethers.constants.AddressZero,
        amount
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
        stakingClient.closeAllocation(ethers.constants.AddressZero)
      ).rejects.toThrow();
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(0);
    });

    test('should throw an error when stakingContract.closeAllocation throws an error', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.closeAllocation.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.closeAllocation(ethers.constants.AddressZero)
      ).rejects.toThrow();

      expect(mockStakingContract.closeAllocation).toHaveBeenCalledWith(
        ethers.constants.AddressZero
      );
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(1);
    });

    test('should call the closeAllocation method with the correct parameters', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.closeAllocation.mockResolvedValueOnce();

      await stakingClient.closeAllocation(ethers.constants.AddressZero);

      expect(mockStakingContract.closeAllocation).toHaveBeenCalledWith(
        ethers.constants.AddressZero
      );
      expect(mockStakingContract.closeAllocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('distributeRewards', () => {
    const invalidAddress = 'InvalidAddress';

    test('should throw an error if an invalid escrow address is provided', async () => {
      await expect(
        stakingClient.distributeRewards(invalidAddress)
      ).rejects.toThrow(ErrorInvalidEscrowAddressProvided);
      expect(mockStakingContract.distributeRewards).toHaveBeenCalledTimes(0);
    });

    test('throws an error if escrow address is not provided by the factory', async () => {
      mockEscrowFactoryContract.hasEscrow.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.distributeRewards(ethers.constants.AddressZero)
      ).rejects.toThrow();
      expect(mockStakingContract.distributeRewards).toHaveBeenCalledTimes(0);
    });

    test('should call distributeReward on the reward pool contract', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      vi.spyOn(stakingClient, 'distributeRewards').mockImplementation(() =>
        Promise.resolve(undefined)
      );

      const results = await stakingClient.distributeRewards(
        ethers.constants.AddressZero
      );

      expect(results).toBeUndefined();
    });
  });

  describe('getStaker', () => {
    const stakerAddress = ethers.constants.AddressZero;
    const invalidAddress = 'InvalidAddress';

    test('should return staker information', async () => {
      const mockStaker: IStaker = {
        tokensStaked: ethers.utils.parseEther('100'),
        tokensAllocated: ethers.utils.parseEther('50'),
        tokensLocked: ethers.utils.parseEther('25'),
        tokensLockedUntil: ethers.BigNumber.from(0),
        tokensAvailable: ethers.utils.parseEther('25'),
      };
      mockStakingContract.getStaker.mockResolvedValueOnce(mockStaker);

      const result = await stakingClient.getStaker(stakerAddress);
      expect(result).toEqual(mockStaker);
      expect(mockStakingContract.getStaker).toHaveBeenCalledWith(stakerAddress);
      expect(mockStakingContract.getStaker).toHaveBeenCalledTimes(1);
    });

    test('should throw an error for an invalid staker address', async () => {
      await expect(stakingClient.getStaker(invalidAddress)).rejects.toThrow(
        ErrorInvalidStakerAddressProvided
      );
      expect(mockStakingContract.getStaker).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if the staking contract call fails', async () => {
      mockStakingContract.getStaker.mockRejectedValue(new Error());

      await expect(stakingClient.getStaker(stakerAddress)).rejects.toThrow();
      expect(mockStakingContract.getStaker).toHaveBeenCalledWith(stakerAddress);
      expect(mockStakingContract.getStaker).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllStakers()', () => {
    const mockStaker: IStaker = {
      tokensStaked: ethers.utils.parseEther('100'),
      tokensAllocated: ethers.utils.parseEther('50'),
      tokensLocked: ethers.utils.parseEther('25'),
      tokensLockedUntil: ethers.BigNumber.from(0),
      tokensAvailable: ethers.utils.parseEther('25'),
    };
    const stakerAddress = ethers.constants.AddressZero;

    test('should return an array of stakers', async () => {
      mockStakingContract.getListOfStakers.mockResolvedValueOnce([
        [stakerAddress, stakerAddress],
        [mockStaker, mockStaker],
      ]);

      const stakers = await stakingClient.getAllStakers();

      expect(stakers).toEqual([mockStaker, mockStaker]);
      expect(mockStakingContract.getListOfStakers).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if no stakers are found', async () => {
      mockStakingContract.getListOfStakers.mockResolvedValue([[], []]);
      await expect(stakingClient.getAllStakers()).rejects.toThrow();
      expect(mockStakingContract.getListOfStakers).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if there is an error in getting stakers', async () => {
      mockStakingContract.getListOfStakers.mockRejectedValueOnce(new Error());
      await expect(stakingClient.getAllStakers()).rejects.toThrow();
      expect(mockStakingContract.getListOfStakers).toHaveBeenCalledTimes(1);
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
        stakingClient.getAllocation(ethers.constants.AddressZero)
      ).rejects.toThrow();
      expect(mockStakingContract.getAllocation).toHaveBeenCalledTimes(0);
    });

    test('should return allocation information', async () => {
      const mockAllocation: IAllocation = {
        escrowAddress: ethers.constants.AddressZero,
        staker: ethers.constants.AddressZero,
        tokens: ethers.utils.parseEther('100'),
        createdAt: ethers.utils.parseEther('100'),
        closedAt: ethers.utils.parseEther('100'),
      };
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.getAllocation.mockResolvedValueOnce(mockAllocation);

      const result = await stakingClient.getAllocation(
        ethers.constants.AddressZero
      );
      expect(result).toEqual(mockAllocation);
      expect(mockStakingContract.getAllocation).toHaveBeenCalledWith(
        ethers.constants.AddressZero
      );
      expect(mockStakingContract.getAllocation).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the allocation data cannot be retrieved', async () => {
      mockEscrowFactoryContract.hasEscrow.mockResolvedValueOnce(true);
      mockStakingContract.getAllocation.mockRejectedValue(new Error());
      await expect(
        stakingClient.getAllocation(ethers.constants.AddressZero)
      ).rejects.toThrow();
    });
  });

  describe('getRewards', () => {
    const invalidAddress = 'InvalidAddress';
    const gqlRawResult = {
      rewardAddedEvents: {
        escrow: ethers.constants.AddressZero,
        amount: ethers.utils.parseEther('100'),
      },
    };

    const mockReward: IReward = {
      escrowAddress: ethers.constants.AddressZero,
      amount: ethers.utils.parseEther('100'),
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

      const results = await stakingClient.getRewards(
        ethers.constants.AddressZero
      );

      expect(results).toEqual([mockReward, mockReward]);
    });
  });
});
