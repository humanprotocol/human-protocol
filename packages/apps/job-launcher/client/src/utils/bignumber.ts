import { ethers, BigNumber } from 'ethers';

export const formatAmount = (amount: string) => {
  return Number(ethers.utils.formatUnits(BigNumber.from(amount), 18)).toFixed(
    2
  );
};
