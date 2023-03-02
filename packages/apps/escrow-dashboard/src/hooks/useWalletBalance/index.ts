import { ESCROW_NETWORKS, ChainId } from 'src/constants/index';
import useHMTPrice from 'src/hooks/useHMTPrice';
import { Address, useAccount, useBalance, useChainId } from 'wagmi';

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
