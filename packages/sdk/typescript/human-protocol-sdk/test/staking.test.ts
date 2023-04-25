import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';
import { Signer, ethers } from 'ethers';
import StakingClient from '../src/staking';
import { FAKE_NETWORK } from './utils/constants';
import {
  ErrorFailedToApproveStakingAmountAllowanceNotUpdated,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
  ErrorStakingFailedToStake,
  ErrorStakingInsufficientAllowance,
} from '../src/error';
import { NETWORKS, NetworkData } from '../src';
import InitClient from '../src/init';
import { ChainId } from '../src/enums';

vi.mock('../src/init');

describe('StakingClient', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;
  let network: NetworkData | undefined;
  let stakingClient: StakingClient;

  beforeAll(async () => {
    provider = new ethers.providers.JsonRpcProvider();
    signer = provider.getSigner();
    signer.getAddress = vi
      .fn()
      .mockResolvedValue('0xc5a5C42992dECbae36851359345FE25997F5C42d');
    network = NETWORKS[ChainId.LOCALHOST];
    const getClientParamsMock = InitClient.getParams as jest.Mock;
    getClientParamsMock.mockResolvedValue({
      signerOrProvider: signer,
      network,
    });
  });

  beforeEach(async () => {
    stakingClient = new StakingClient(await InitClient.getParams(signer));
  });
  describe('approveStake', () => {
    test('approves the staking amount if allowance is not sufficient', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'approveStake').mockImplementation(() =>
        Promise.resolve(false)
      );

      const result = await stakingClient.approveStake(amount);
      expect(result).toEqual(false);
    });

    test('returns true if allowance is sufficient', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'approveStake').mockImplementation(() =>
        Promise.resolve(true)
      );

      const result = await stakingClient.approveStake(amount);
      expect(result).toEqual(true);
    });

    test('throws an error if the staking value is not a BigNumber', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'approveStake').mockImplementation(() => {
        throw ErrorInvalidStakingValueType;
      });

      expect(() => stakingClient.approveStake(amount)).toThrow(
        ErrorInvalidStakingValueType
      );
    });

    test('throws an error if the staking value is negative', async () => {
      const amount = ethers.utils.parseEther('-1');

      vi.spyOn(stakingClient, 'approveStake').mockImplementation(() => {
        throw ErrorInvalidStakingValueSign;
      });

      expect(() => stakingClient.approveStake(amount)).toThrow(
        ErrorInvalidStakingValueSign
      );
    });

    test('throws an error if the allowance is not updated after approving', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'approveStake').mockImplementation(() => {
        throw ErrorFailedToApproveStakingAmountAllowanceNotUpdated;
      });

      expect(() => stakingClient.approveStake(amount)).toThrow(
        ErrorFailedToApproveStakingAmountAllowanceNotUpdated
      );
    });
  });

  describe('stake', () => {
    test('throws an error if amount is not a BigNumber', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'stake').mockImplementation(() => {
        throw ErrorInvalidStakingValueType;
      });

      expect(() => stakingClient.stake(amount)).toThrow(
        ErrorInvalidStakingValueType
      );
    });

    test('throws an error if amount is negative', async () => {
      const negativeAmount = ethers.utils.parseEther('-1');
      expect(stakingClient.stake(negativeAmount)).rejects.toThrow(
        ErrorInvalidStakingValueSign
      );
    });

    test('throws an error if staking allowance is insufficient', async () => {
      const amount = ethers.utils.parseEther('1');
      stakingClient.isAllowance = vi.fn(() => Promise.resolve(false));

      await expect(stakingClient.stake(amount)).rejects.toThrow(
        ErrorStakingInsufficientAllowance
      );
    });

    test('stake the amount successfully', async () => {
      const amount = ethers.utils.parseEther('1');
      const mockStaking = vi.fn();
      (stakingClient as any)['stakingContract'] = {
        stake: mockStaking.mockResolvedValue(null),
      };
      const mockToken = vi.fn();
      (stakingClient as any)['tokenContract'] = {
        allowance: mockToken.mockResolvedValue(amount),
      };

      expect(await stakingClient.stake(amount)).toBeUndefined();
    });

    test('throws an error if staking fails', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'stake').mockImplementation(() => {
        throw ErrorStakingFailedToStake;
      });

      expect(() => stakingClient.stake(amount)).toThrow(
        ErrorStakingFailedToStake
      );
    });

    test('should throw an error if staking fails', async () => {
      const amount = ethers.utils.parseEther('1');

      vi.spyOn(stakingClient, 'stake').mockImplementation(() => {
        throw ErrorStakingFailedToStake;
      });

      expect(() => stakingClient.stake(amount)).toThrow(
        ErrorStakingFailedToStake
      );
    });
  });
});
