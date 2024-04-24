import { z } from 'zod';
import last from 'lodash/last';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import { addStake } from '@/smart-contracts/stake/add-stake';
import type { ResponseError } from '@/shared/types/global.type';

export const addStakeCallArgumentsSchema = z.object({
  amount: z.coerce.number().min(1).max(1_000_000_000),
  address: z.string(),
});

export type AddStakeCallArguments = z.infer<typeof addStakeCallArgumentsSchema>;

async function addStakeMutationFn(data: AddStakeCallArguments) {
  await addStake(data);
  return data;
}

export const addStakeMutationKey = ['addStake'];

export function useAddStakeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStakeMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: addStakeMutationKey,
  });
}

export function useAddStakeMutationState() {
  const state = useMutationState({
    filters: { mutationKey: addStakeMutationKey },
    select: (mutation) => mutation.state,
  });
  const result = last(state) as
    | MutationState<unknown, ResponseError, AddStakeCallArguments>
    | undefined;
  return result;
}
