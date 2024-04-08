import { ethers, BigNumber } from 'ethers';

export const formatAmount = (amount: string) => {
  return amount;
  return ethers.utils.formatUnits(BigNumber.from(amount), 18);
};
