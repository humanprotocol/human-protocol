import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editExistingKeys } from '@/smart-contracts/keys/edit-existing-keys';

export const editExistingKeysCallArgumentsSchema = z.object({
  fee: z.coerce.number().min(1).max(100).step(1),
  webhookUrl: z.string().url(),
  jobTypes: z.array(z.string()),
});

export type EditExistingKeysCallArguments = z.infer<
  typeof editExistingKeysCallArgumentsSchema
>;

function editExistingKeysMutationFn(
  data: EditExistingKeysCallArguments & { address: string }
) {
  return editExistingKeys(data);
}

export function useEditExistingKeysMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editExistingKeysMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
