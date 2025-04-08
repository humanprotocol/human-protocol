import { z, ZodError } from 'zod';
import { t } from 'i18next';
import {
  EthKVStoreKeys,
  JobType,
  Role,
} from '@/modules/smart-contracts/EthKVStore/config';
import { type GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { urlDomainSchema } from '@/shared/schemas';

const fieldsValidations = {
  [EthKVStoreKeys.PublicKey]: urlDomainSchema,
  [EthKVStoreKeys.Url]: urlDomainSchema,
  [EthKVStoreKeys.WebhookUrl]: urlDomainSchema,
  [EthKVStoreKeys.Role]: z.nativeEnum(Role),
  [EthKVStoreKeys.JobTypes]: z.array(z.nativeEnum(JobType)).min(1),
  [EthKVStoreKeys.Fee]: z.coerce
    // eslint-disable-next-line camelcase
    .number({ invalid_type_error: t('validation.required') })
    .min(0, t('validation.feeValidationError'))
    .max(100, t('validation.feeValidationError'))
    .step(1, t('validation.feeValidationError')),
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
  return editEthKVStoreValuesMutationSchema.transform<EditEthKVStoreValuesMutationData>(
    (newData, ctx) => {
      const fieldsThatHasChanges: EditEthKVStoreValuesMutationData = {};
      Object.values(EthKVStoreKeys).forEach((key) => {
        const newFiledData = newData[key];
        const initialFiledData = initialData[key];

        let hasFieldChanged = false;
        if (Array.isArray(newFiledData) && Array.isArray(initialFiledData)) {
          if (
            newFiledData.sort().toString() !==
            initialFiledData.sort().toString()
          ) {
            hasFieldChanged = true;
          }
        } else if (
          typeof newFiledData === 'number' &&
          newFiledData.toString() !== initialFiledData?.toString()
        ) {
          hasFieldChanged = true;
        } else {
          // eslint-disable-next-line eqeqeq -- expect to do conversion for this compare
          hasFieldChanged = newFiledData != initialFiledData;
        }

        if (hasFieldChanged) {
          Object.assign(fieldsThatHasChanges, { [key]: newFiledData });
        }
      });

      if (Object.values(fieldsThatHasChanges).length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('operator.addKeysPage.editKeysForm.error'),
          path: ['form'],
        });

        return z.NEVER;
      }

      return fieldsThatHasChanges;
    }
  ) as z.ZodType<
    EditEthKVStoreValuesMutationData,
    z.ZodTypeDef,
    GetEthKVStoreValuesSuccessResponse
  >;
};
