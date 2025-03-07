import { ethers } from 'ethers';
import { t } from 'i18next';

export const stakedAmountFormatter = (amount: bigint) => {
  const amountAsString = ethers.formatEther(amount);

  if (amountAsString.split('.')[1] === '0') {
    // decimals part should be omitted
    return `${amountAsString.replace('.0', '')} ${t('inputMasks.humanCurrencySuffix')}`;
  }
  return `${ethers.formatEther(amount)} ${t('inputMasks.humanCurrencySuffix')}`;
};
