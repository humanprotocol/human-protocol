import { useState } from 'react';
import { t } from 'i18next';
import { Grid } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';
import type { EditEthKVStoreValuesMutationData } from '@/api/servieces/operator/edit-existing-keys';
import {
  editEthKVStoreValuesMutationSchema,
  useEditExistingKeysMutation,
  useEditExistingKeysMutationState,
} from '@/api/servieces/operator/edit-existing-keys';
import { Button } from '@/components/ui/button';
import { ExistingKeys } from '@/pages/operator/sign-up/add-keys/existing-keys';
import { EditExistingKeysForm } from '@/pages/operator/sign-up/add-keys/edit-existing-keys-form';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';
import { useGetKeys } from '@/api/servieces/operator/get-keys';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';

export type UseFormResult = UseFormReturn<
  GetEthKVStoreValuesSuccessResponse,
  EditEthKVStoreValuesMutationData
>;

export function AddKeysOperatorPage() {
  const {
    data: keysData,
    isError: isGetKeysError,
    error: getKeysError,
    isPending: isGetKeysPending,
  } = useGetKeys();
  const editExistingKeysMutationState = useEditExistingKeysMutationState();

  const errorAlert = editExistingKeysMutationState?.error ? (
    <Alert color="error" severity="error">
      {defaultErrorMessage(
        editExistingKeysMutationState.error,
        jsonRpcErrorHandler
      )}
    </Alert>
  ) : undefined;

  if (isGetKeysError) {
    return (
      <PageCardError
        errorMessage={defaultErrorMessage(getKeysError, jsonRpcErrorHandler)}
      />
    );
  }

  if (isGetKeysPending) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={errorAlert}
      backArrowPath={-1}
      title={t('operator.addKeysPage.title')}
    >
      <Form keysData={keysData} />
    </PageCard>
  );
}

export function Form({
  keysData,
}: {
  keysData: GetEthKVStoreValuesSuccessResponse;
}) {
  const [editMode, setEditMode] = useState(false);
  const editExistingKeys = useEditExistingKeysMutation();

  const methods = useForm<
    GetEthKVStoreValuesSuccessResponse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
    any,
    EditEthKVStoreValuesMutationData
  >({
    defaultValues: keysData,
    resolver: zodResolver(editEthKVStoreValuesMutationSchema),
  });

  const handleEdit = (data: EditEthKVStoreValuesMutationData) => {
    editExistingKeys.mutate(data);
  };

  return (
    <Grid container gap="2rem" marginTop="1rem">
      <FormProvider<
        GetEthKVStoreValuesSuccessResponse,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
        any,
        EditEthKVStoreValuesMutationData
      >
        {...methods}
      >
        <form
          onSubmit={(event) => {
            void methods.handleSubmit(handleEdit)(event);
          }}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem',
          }}
        >
          {editMode ? (
            <EditExistingKeysForm
              closeEditMode={setEditMode.bind(null, false)}
            />
          ) : (
            <ExistingKeys openEditMode={setEditMode.bind(null, true)} />
          )}
          <Button
            fullWidth
            loading={editExistingKeys.isPending}
            type="submit"
            variant="contained"
          >
            {t('operator.addKeysPage.btn')}
          </Button>
        </form>
      </FormProvider>
    </Grid>
  );
}
