import { useState } from 'react';
import { Grid } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import type { EditEthKVStoreValuesMutationData } from '@/api/servieces/operator/edit-existing-keys';
import {
  getEditEthKVStoreValuesMutationSchema,
  useEditExistingKeysMutation,
} from '@/api/servieces/operator/edit-existing-keys';
import { ExistingKeys } from '@/pages/operator/sign-up/add-keys/existing-keys';
import { EditExistingKeysForm } from '@/pages/operator/sign-up/add-keys/edit-existing-keys-form';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';

export type UseFormResult = UseFormReturn<
  GetEthKVStoreValuesSuccessResponse,
  EditEthKVStoreValuesMutationData
>;

export function ExistingKeysForm({
  keysData,
}: {
  keysData: GetEthKVStoreValuesSuccessResponse;
}) {
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
    resolver: zodResolver(getEditEthKVStoreValuesMutationSchema(keysData)),
  });

  const handleEditExistingKeys = (data: EditEthKVStoreValuesMutationData) => {
    existingKeysMutation.mutate(data);
  };

  return (
    <Grid container gap="2rem" marginTop="1rem">
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
