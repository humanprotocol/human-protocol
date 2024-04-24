import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExistingKeys,
  getPendingKeys,
} from '@/smart-contracts/keys/get-keys';

export const getKeysCallArgumentsSchema = z.object({
  address: z.string(),
});

export type GetKeysCallArguments = z.infer<typeof getKeysCallArgumentsSchema>;

async function getKeysMutationFn(data: GetKeysCallArguments) {
  const existingKeys = await getExistingKeys(data);
  const pendingKeys = await getPendingKeys(data);

  return { existingKeys, pendingKeys };
}

export function useGetKeysMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getKeysMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
