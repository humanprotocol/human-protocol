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
import {
  EthKVStoreKeys,
  JobTypes,
  Role,
} from '@/smart-contracts/EthKVStore/config';
import { ethKvStoreSetBulk } from '@/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';

export const editEthKVStoreValuesMutationSchema = z.object({
  [EthKVStoreKeys.PublicKey]: z.string().min(1),
  [EthKVStoreKeys.WebhookUrl]: z.string().url(),
  [EthKVStoreKeys.Role]: z.nativeEnum(Role),
  [EthKVStoreKeys.JobTypes]: z.array(z.nativeEnum(JobTypes)).min(1),
  [EthKVStoreKeys.Fee]: z.coerce.number().min(1).max(100).step(1),
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

  return ethKvStoreSetBulk({
    keys: [
      EthKVStoreKeys.PublicKey,
      EthKVStoreKeys.WebhookUrl,
      EthKVStoreKeys.Role,
      EthKVStoreKeys.JobTypes,
      EthKVStoreKeys.Fee,
    ],
    values: [
      data[EthKVStoreKeys.PublicKey],
      data[EthKVStoreKeys.WebhookUrl],
      data[EthKVStoreKeys.Role],
      data[EthKVStoreKeys.JobTypes].join(','),
      data[EthKVStoreKeys.Fee].toString(),
    ],
    contractAddress,
    chainId: data.chainId,
    signer: data.signer,
  });
}

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
