import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import type { JsonRpcSigner } from 'ethers';
import { z } from 'zod';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import { EthKVStoreKeys, Role } from '@/smart-contracts/EthKVStore/config';
import { setBulk } from '@/smart-contracts/EthKVStore/set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

export const editEthKVStoreValuesMutationSchema = z.object({
  [EthKVStoreKeys.PublicKey]: z.string().min(1),
  [EthKVStoreKeys.WebhookUrl]: z.string().url(),
  [EthKVStoreKeys.Role]: z
    .array(
      z.enum([
        Role.ExchangeOracle,
        Role.JobLauncher,
        Role.RecordingOracle,
        Role.ReputationOracle,
      ])
    )
    .length(1),
  [EthKVStoreKeys.RecordingOracle]: z.string().min(1),
});

export type EditEthKVStoreValuesMutationData = z.infer<
  typeof editEthKVStoreValuesMutationSchema
>;

function editExistingKeysMutationFn(
  data: EditEthKVStoreValuesMutationData & {
    accountAddress: string;
    chainId: number;
    signer?: JsonRpcSigner;
  }
) {
  const contractAddress = getContractAddress({
    chainId: data.chainId,
    contractName: 'EthKVStore',
  });

  return setBulk({
    keys: [
      EthKVStoreKeys.PublicKey,
      EthKVStoreKeys.WebhookUrl,
      EthKVStoreKeys.Role,
      EthKVStoreKeys.RecordingOracle,
    ],
    values: [
      data[EthKVStoreKeys.PublicKey],
      data[EthKVStoreKeys.WebhookUrl],
      data.Role[0],
      data[EthKVStoreKeys.RecordingOracle],
    ],
    contractAddress,
    chainId: data.chainId,
    signer: data.signer,
  });
}

export const editKeysMutationKey = ['editKeys'];

export function useEditExistingKeysMutation() {
  const {
    address,
    chainId,
    web3ProviderMutation: { data: web3Data },
  } = useConnectedWallet();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: EditEthKVStoreValuesMutationData) =>
      editExistingKeysMutationFn({
        ...data,
        accountAddress: address,
        chainId,
        signer: web3Data?.signer,
      }),
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
