import { ethers } from 'ethers';

export const formatAmount = (amount?: bigint, decimals: number = 8) => {
  if (!amount || amount === 0n) return 0;

  const formatted = ethers.formatEther(amount);

  const [integerPart, decimalPart = ''] = formatted.split('.');

  const truncatedDecimal = decimalPart.substring(0, decimals);

  return parseFloat(
    truncatedDecimal ? `${integerPart}.${truncatedDecimal}` : integerPart
  );
};
