import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getStackedAmount } from '@/smart-contracts/get-staked-amount';
import { useWalletConnect } from '@/hooks/use-wallet-connect';

export const getStakedAmountCallArgumentsSchema = z.object({
  address: z.string(),
});

export type GetStackedAmountCallArguments = z.infer<
  typeof getStakedAmountCallArgumentsSchema
>;

export function useGetStakedAmount() {
  const { address } = useWalletConnect();

  return useQuery({
    queryFn: () => getStackedAmount({ address: address || '' }),
    queryKey: ['getStackedAmount', address],
    refetchInterval: 0,
  });
}
