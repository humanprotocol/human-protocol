import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Address } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';

import { useHMTPrice } from './useHMTPrice';

export default function useWalletBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    chainId,
    token: NETWORKS[chainId as ChainId]?.hmtAddress as Address,
  });
  const price = useHMTPrice();

  return { ...balance, usdPrice: price };
}
