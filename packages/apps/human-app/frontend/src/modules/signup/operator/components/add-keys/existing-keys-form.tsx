import { useState } from 'react';
import { Grid } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn, Resolver } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useEditExistingKeysMutation } from '../../hooks';
import {
  type EditEthKVStoreValuesMutationData,
  getEditEthKVStoreValuesMutationSchema,
} from '../../schema';
import { EditExistingKeysForm } from './edit-existing-keys-form';
import { ExistingKeys } from './existing-keys';

export type UseFormResult = UseFormReturn<
  GetEthKVStoreValuesSuccessResponse,
  EditEthKVStoreValuesMutationData
>;

export function ExistingKeysForm({
  keysData,
}: Readonly<{
  keysData: GetEthKVStoreValuesSuccessResponse;
}>) {
  const [editMode, setEditMode] = useState(false);
  const existingKeysMutation = useEditExistingKeysMutation();
  const pendingKeysMutation = useEditExistingKeysMutation();
  const existingKeysMethods = useForm<
    GetEthKVStoreValuesSuccessResponse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
    any,
    EditEthKVStoreValuesMutationData
  >({
    defaultValues: keysData,
    resolver: zodResolver(
      getEditEthKVStoreValuesMutationSchema(keysData)
    ) as Resolver<GetEthKVStoreValuesSuccessResponse>,
  });

  const handleEditExistingKeys = (data: EditEthKVStoreValuesMutationData) => {
    existingKeysMutation.mutate(data);
  };

  useResetMutationErrors(existingKeysMethods.watch, existingKeysMutation.reset);

  return (
    <Grid container gap="2rem">
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '3rem',
        }}
      >
        <FormProvider<
          GetEthKVStoreValuesSuccessResponse,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
          any,
          EditEthKVStoreValuesMutationData
        >
          {...existingKeysMethods}
        >
          <form
            onSubmit={(event) => {
              void existingKeysMethods.handleSubmit(handleEditExistingKeys)(
                event
              );
            }}
          >
            {editMode ? (
              <EditExistingKeysForm
                existingKeysInitialState={keysData}
                formButtonProps={{
                  loading: existingKeysMutation.isPending,
                  type: 'submit',
                  variant: 'contained',
                  disabled: pendingKeysMutation.isPending,
                }}
              />
            ) : (
              <ExistingKeys
                existingKeysInitialState={keysData}
                openEditMode={setEditMode.bind(null, true)}
              />
            )}
          </form>
        </FormProvider>
      </div>
    </Grid>
  );
}
