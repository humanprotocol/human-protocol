import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getStackedAmount } from '@/smart-contracts/get-staked-amount';

export const getStakedAmountCallArgumentsSchema = z.object({
  address: z.string(),
});

export type GetStackedAmountCallArguments = z.infer<
  typeof getStakedAmountCallArgumentsSchema
>;

function getStackedAmountMutationFn(data: GetStackedAmountCallArguments) {
  return getStackedAmount(data);
}

export function useGetStakedAmountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getStackedAmountMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
