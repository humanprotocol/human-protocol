import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getStackedAmount } from '@/smart-contracts/stake/get-staked-amount';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

export const getStakedAmountCallArgumentsSchema = z.object({
  address: z.string(),
});

export type GetStackedAmountCallArguments = z.infer<
  typeof getStakedAmountCallArgumentsSchema
>;

export function useGetStakedAmount() {
  const { address } = useConnectedWallet();

  return useQuery({
    queryFn: () => getStackedAmount({ address }),
    queryKey: ['getStackedAmount', address],
    refetchInterval: 0,
  });
}
