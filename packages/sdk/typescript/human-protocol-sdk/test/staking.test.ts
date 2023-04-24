import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import StakingClient from '../src/staking';
import { FAKE_NETWORK } from './utils/constants';
import {
  ErrorFailedToApproveStakingAmountAllowanceNotUpdated,
  ErrorInvalidStakingValueSign,
  ErrorInvalidStakingValueType,
} from '../src/error';

describe('StakingClient', () => {
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = provider.getSigner();
  const clientParams = {
    signerOrProvider: signer,
    network: FAKE_NETWORK,
  };
  let stakingClient: StakingClient;

  beforeEach(() => {
    stakingClient = new StakingClient(clientParams);
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
});
