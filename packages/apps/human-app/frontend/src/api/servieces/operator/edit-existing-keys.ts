import { z } from 'zod';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import { editExistingKeys } from '@/smart-contracts/keys/edit-existing-keys';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';

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
  const { address } = useConnectedWallet();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: EditExistingKeysCallArguments) =>
      editExistingKeysMutationFn({ ...data, address }),
    onSuccess: async () => {
      navigate(routerPaths.operator.editExistingKeysSuccess);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: ['editKeys', address],
  });
}

export function useEditExistingKeysMutationState() {
  const { address } = useConnectedWallet();

  const state = useMutationState({
    filters: { mutationKey: ['editKeys', address] },
    select: (mutation) => mutation.state,
  });

  return last(state);
}
