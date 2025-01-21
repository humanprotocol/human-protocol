/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { StakingClient } from '../src/staking';
import {
  DEFAULT_GAS_PAYER_PRIVKEY,
  FAKE_AMOUNT,
  FAKE_NEGATIVE_AMOUNT,
} from './utils/constants';

describe('StakingClient', () => {
  let stakingClient: any,
    mockProvider: any,
    mockSigner: any,
    mockStakingContract: any,
    mockEscrowFactoryContract: any,
    mockTokenContract: any;

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
      getStaker: vi.fn(),
      getListOfStakers: vi.fn(),
      getAddress: vi.fn().mockResolvedValue(ethers.ZeroAddress),
      stakes: vi.fn(),
    };

    mockEscrowFactoryContract = {
      hasEscrow: vi.fn(),
    };

    mockTokenContract = {
      allowance: vi.fn(),
      approve: vi.fn(),
    };

    stakingClient = await StakingClient.build(mockSigner);
    stakingClient.stakingContract = mockStakingContract;
    stakingClient.tokenContract = mockTokenContract;
    stakingClient.escrowFactoryContract = mockEscrowFactoryContract;
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

  describe('getStakerInfo', () => {
    const stakerAddress = ethers.ZeroAddress;

    test('should return staker info with locked amount and no withdrawable tokens', async () => {
      const stakerInfo = {
        tokensStaked: ethers.toBigInt(FAKE_AMOUNT),
        tokensLocked: ethers.toBigInt(FAKE_AMOUNT),
        tokensLockedUntil: 1234567890n,
      };
      const blockNumber = 1234567880n;

      mockStakingContract.stakes.mockResolvedValueOnce(stakerInfo);
      mockProvider.provider.getBlockNumber = vi
        .fn()
        .mockResolvedValue(blockNumber);

      const result = await stakingClient.getStakerInfo(stakerAddress);

      expect(result).toEqual({
        stakedAmount: stakerInfo.tokensStaked,
        lockedAmount: stakerInfo.tokensLocked,
        lockedUntil: stakerInfo.tokensLockedUntil,
        withdrawableAmount: 0n,
      });
      expect(mockStakingContract.stakes).toHaveBeenCalledWith(stakerAddress);
      expect(mockStakingContract.stakes).toHaveBeenCalledTimes(1);
      expect(mockProvider.provider.getBlockNumber).toHaveBeenCalledTimes(1);
    });

    test('should return staker info with locked amount 0 and withdrawable tokens', async () => {
      const stakerInfo = {
        tokensStaked: ethers.toBigInt(FAKE_AMOUNT),
        tokensLocked: ethers.toBigInt(FAKE_AMOUNT),
        tokensLockedUntil: 1234567890n,
      };
      const blockNumber = 1234567891n;

      mockStakingContract.stakes.mockResolvedValueOnce(stakerInfo);
      mockProvider.provider.getBlockNumber = vi
        .fn()
        .mockResolvedValue(blockNumber);

      const result = await stakingClient.getStakerInfo(stakerAddress);

      expect(result).toEqual({
        stakedAmount: stakerInfo.tokensStaked,
        lockedAmount: 0n,
        lockedUntil: 0n,
        withdrawableAmount: stakerInfo.tokensLocked,
      });
      expect(mockStakingContract.stakes).toHaveBeenCalledWith(stakerAddress);
      expect(mockStakingContract.stakes).toHaveBeenCalledTimes(1);
      expect(mockProvider.provider.getBlockNumber).toHaveBeenCalledTimes(1);
    });

    test('should throw an error if the staker address is invalid', async () => {
      const invalidAddress = 'InvalidAddress';

      await expect(stakingClient.getStakerInfo(invalidAddress)).rejects.toThrow(
        ErrorInvalidStakerAddressProvided
      );
      expect(mockStakingContract.stakes).toHaveBeenCalledTimes(0);
    });

    test('should throw an error if getStaker method fails', async () => {
      mockStakingContract.stakes.mockRejectedValueOnce(new Error());

      await expect(
        stakingClient.getStakerInfo(stakerAddress)
      ).rejects.toThrow();
      expect(mockStakingContract.stakes).toHaveBeenCalledWith(stakerAddress);
      expect(mockStakingContract.stakes).toHaveBeenCalledTimes(1);
    });
  });
});
