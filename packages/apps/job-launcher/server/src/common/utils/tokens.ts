import { ChainId } from '@human-protocol/sdk';
import { ethers } from 'ethers';
import { TOKEN_ADDRESSES } from '../constants/tokens';
import { EscrowFundToken } from '../enums/job';

/**
 * Returns decimals for a token, clamped to defaultDecimals (internal default = 6).
 * Pass a higher defaultDecimals (e.g. 18) when full on-chain precision is required.
 */
export function getTokenDecimals(
  chainId: ChainId,
  symbol: EscrowFundToken,
  defaultDecimals = 6,
): number {
  return Math.min(
    TOKEN_ADDRESSES[chainId]?.[symbol]?.decimals ?? defaultDecimals,
    defaultDecimals,
  );
}

export function calculateNetFundAmount(
  fundAmount: number,
  decimals: number,
  oracleFeePercentages: bigint[],
): number {
  const fundAmountInWei = ethers.parseUnits(fundAmount.toString(), decimals);
  const oracleFees = oracleFeePercentages.reduce(
    (totalFees, feePercentage) =>
      totalFees + (fundAmountInWei * feePercentage) / 100n,
    0n,
  );

  return Number(ethers.formatUnits(fundAmountInWei - oracleFees, decimals));
}
