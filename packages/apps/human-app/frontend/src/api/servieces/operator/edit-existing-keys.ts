import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import type { JsonRpcSigner } from 'ethers';
import { z } from 'zod';
import { t } from 'i18next';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import {
  EthKVStoreKeys,
  JobTypes,
  Role,
} from '@/smart-contracts/EthKVStore/config';
import { ethKvStoreSetBulk } from '@/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';

export const editEthKVStoreValuesMutationSchema = z.object({
  [EthKVStoreKeys.PublicKey]: z.string().min(1).optional(),
  [EthKVStoreKeys.WebhookUrl]: z.string().url().optional(),
  [EthKVStoreKeys.Role]: z.nativeEnum(Role).optional(),
  [EthKVStoreKeys.JobTypes]: z.array(z.nativeEnum(JobTypes)).optional(),
  [EthKVStoreKeys.Fee]: z.coerce.number().min(1).max(100).step(1).optional(),
});

export type EditEthKVStoreValuesMutationData = z.infer<
  typeof editEthKVStoreValuesMutationSchema
>;

export const getEditEthKVStoreValuesMutationSchema = (
  initialData: GetEthKVStoreValuesSuccessResponse
) => {
  return editEthKVStoreValuesMutationSchema.transform((newData, ctx) => {
    // add only values that has changed, if no values that has changed throws error
    const result: EditEthKVStoreValuesMutationData = {};
    Object.values(EthKVStoreKeys).forEach((key) => {
      if (key === 'job_types') {
        if (
          newData[key]?.sort().toString() !==
          initialData[key]?.sort().toString()
        ) {
          Object.assign(result, { [key]: newData[key] });
        }
        return;
      }

      if (key === 'fee') {
        if (newData[key]?.toString() !== initialData[key]?.toString()) {
          Object.assign(result, { [key]: newData[key] });
        }
        return;
      }

      if (newData[key] !== initialData[key]) {
        Object.assign(result, { [key]: newData[key] });
      }
    });

    if (!Object.values(result).length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('operator.addKeysPage.editKeysForm.error'),
        path: ['form'],
      });
    }

    return result;
  });
};

function editExistingKeysMutationFn(
  formData: EditEthKVStoreValuesMutationData,
  userData: {
    accountAddress: string;
    chainId: number;
    signer?: JsonRpcSigner;
  }
) {
  const contractAddress = getContractAddress({
    chainId: userData.chainId,
    contractName: 'EthKVStore',
  });

  const keys: string[] = [];
  const values: string[] = [];

  Object.entries(formData).forEach(([formFieldName, formFieldValue]) => {
    if (!formFieldValue) {
      return;
    }
    keys.push(formFieldName);
    values.push(formFieldValue.toString());
  });

  return ethKvStoreSetBulk({
    keys,
    values,
    contractAddress,
    chainId: userData.chainId,
    signer: userData.signer,
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
      editExistingKeysMutationFn(data, {
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
