import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { useNavigate } from 'react-router-dom';
import type { JsonRpcSigner } from 'ethers';
import { z, ZodError } from 'zod';
import { t } from 'i18next';
import { routerPaths } from '@/router/router-paths';
import { useConnectedWallet } from '@/auth-web3/use-connected-wallet';
import {
  EthKVStoreKeys,
  JobType,
  Role,
} from '@/smart-contracts/EthKVStore/config';
import { ethKvStoreSetBulk } from '@/smart-contracts/EthKVStore/eth-kv-store-set-bulk';
import { getContractAddress } from '@/smart-contracts/get-contract-address';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/services/operator/get-keys';
import { isArray } from '@/shared/helpers/is-array';
import { urlDomainSchema } from '@/shared/helpers/url-domain-validation';

const fieldsValidations = {
  [EthKVStoreKeys.PublicKey]: urlDomainSchema,
  [EthKVStoreKeys.Url]: urlDomainSchema,
  [EthKVStoreKeys.WebhookUrl]: urlDomainSchema,
  [EthKVStoreKeys.Role]: z.nativeEnum(Role),
  [EthKVStoreKeys.JobTypes]: z.array(z.nativeEnum(JobType)).min(1),
  [EthKVStoreKeys.Fee]: z.coerce
    // eslint-disable-next-line camelcase
    .number({ invalid_type_error: t('validation.required') })
    .min(1)
    .max(100)
    .step(1),
};

export const editEthKVStoreValuesMutationSchema = z.object({
  [EthKVStoreKeys.PublicKey]:
    fieldsValidations[EthKVStoreKeys.PublicKey].optional(),
  [EthKVStoreKeys.Url]: fieldsValidations[EthKVStoreKeys.Url].optional(),
  [EthKVStoreKeys.WebhookUrl]:
    fieldsValidations[EthKVStoreKeys.WebhookUrl].optional(),
  [EthKVStoreKeys.Role]: fieldsValidations[EthKVStoreKeys.Role].optional(),
  [EthKVStoreKeys.JobTypes]:
    fieldsValidations[EthKVStoreKeys.JobTypes].optional(),
  [EthKVStoreKeys.Fee]: fieldsValidations[EthKVStoreKeys.Fee].optional(),
});

export type EditEthKVStoreValuesMutationData = z.infer<
  typeof editEthKVStoreValuesMutationSchema
>;

export const setEthKVStoreValuesMutationSchema = (
  initialFields: GetEthKVStoreValuesSuccessResponse
) => {
  return editEthKVStoreValuesMutationSchema.superRefine((newData, ctx) => {
    Object.keys(initialFields).forEach((key) => {
      const typedKey = key as keyof GetEthKVStoreValuesSuccessResponse;
      const initialField = initialFields[typedKey];
      if (!initialField) {
        try {
          fieldsValidations[typedKey].parse(newData[typedKey]);
        } catch (error) {
          if (error instanceof ZodError) {
            error.issues[0].path = [typedKey];
            ctx.addIssue(error.issues[0]);
          }
        }
      }
    });
  });
};

export const getEditEthKVStoreValuesMutationSchema = (
  initialData: GetEthKVStoreValuesSuccessResponse
) => {
  return editEthKVStoreValuesMutationSchema.transform((newData, ctx) => {
    const fieldsThatHasChanges: EditEthKVStoreValuesMutationData = {};
    Object.values(EthKVStoreKeys).forEach((key) => {
      const newFiledData = newData[key];
      const initialFiledData = initialData[key];

      if (isArray(newFiledData) && isArray(initialFiledData)) {
        if (
          newFiledData.sort().toString() === initialFiledData.sort().toString()
        ) {
          return;
        }
        Object.assign(fieldsThatHasChanges, { [key]: newFiledData.toString() });
        return;
      }

      if (
        typeof newFiledData === 'number' &&
        newFiledData.toString() !== initialFiledData?.toString()
      ) {
        Object.assign(fieldsThatHasChanges, { [key]: newFiledData });
        return;
      }

      // eslint-disable-next-line eqeqeq -- expect to do conversion for this compare
      if (newFiledData != initialFiledData) {
        Object.assign(fieldsThatHasChanges, { [key]: newFiledData });
      }
    });

    if (!Object.values(fieldsThatHasChanges).length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t('operator.addKeysPage.editKeysForm.error'),
        path: ['form'],
      });
    }
    return fieldsThatHasChanges;
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
