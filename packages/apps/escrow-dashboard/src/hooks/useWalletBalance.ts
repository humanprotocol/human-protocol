import { Address, useAccount, useBalance, useChainId } from 'wagmi';

import { useHMTPrice } from './useHMTPrice';

import { ESCROW_NETWORKS, ChainId } from 'src/constants';

export default function useWalletBalance() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    chainId,
    token: ESCROW_NETWORKS[chainId as ChainId]?.hmtAddress as Address,
    watch: true,
  });
  const price = useHMTPrice();

  return { ...balance, usdPrice: price };
}
