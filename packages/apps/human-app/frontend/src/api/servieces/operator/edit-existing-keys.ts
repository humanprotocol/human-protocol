import { z } from 'zod';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import { editExistingKeys } from '@/smart-contracts/keys/edit-existing-keys';
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { routerPaths } from '@/router/router-paths';

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

export const editKeysMutationKey = ['editKeys'];

export function useEditExistingKeysMutation() {
  const { address } = useWalletConnect();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: EditExistingKeysCallArguments) =>
      editExistingKeysMutationFn({ ...data, address: address || '' }),
    onSuccess: async () => {
      navigate(routerPaths.operator.editExistingKeysSuccess);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: editKeysMutationKey,
  });
}

export function useEditExistingKeysMutationState() {
  const state = useMutationState({
    filters: { mutationKey: editKeysMutationKey },
    select: (mutation) => mutation.state,
  });

  return last(state);
}
