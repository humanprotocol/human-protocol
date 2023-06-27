import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { Address, useAccount, useBalance, useChainId } from 'wagmi';

import { useHMTPrice } from './useHMTPrice';

export default function useWalletBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    chainId,
    token: NETWORKS[chainId as ChainId]?.hmtAddress as Address,
    watch: true,
  });
  const price = useHMTPrice();

  return { ...balance, usdPrice: price };
}
