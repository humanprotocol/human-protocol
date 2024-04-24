import { z } from 'zod';
import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addStake } from '@/smart-contracts/stake/add-stake';

export const addStakeCallArgumentsSchema = z.object({
  amount: z.coerce.number().min(1).max(1_000_000_000),
  address: z.string(),
});

export type AddStakeCallArguments = z.infer<typeof addStakeCallArgumentsSchema>;

function addStakeMutationFn(data: AddStakeCallArguments) {
  return addStake(data);
}
type OnSuccess = UseMutationOptions<
  void,
  unknown,
  AddStakeCallArguments
>['onSuccess'];

export function useAddStakeMutation(useMutationOptions?: {
  onSuccess?: OnSuccess;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStakeMutationFn,
    onSuccess: async (...onSuccessArgs) => {
      if (useMutationOptions?.onSuccess) {
        useMutationOptions.onSuccess(...onSuccessArgs);
      }
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
