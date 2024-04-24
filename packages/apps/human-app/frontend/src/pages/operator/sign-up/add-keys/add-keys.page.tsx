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
import { useGetKeys } from '@/api/servieces/operator/get-keys';
import { PendingKeys } from '@/pages/operator/sign-up/add-keys/pending-keys';
import type { EditExistingKeysCallArguments } from '@/api/servieces/operator/edit-existing-keys';
import {
  editExistingKeysCallArgumentsSchema,
  useEditExistingKeysMutation,
  useEditExistingKeysMutationState,
} from '@/api/servieces/operator/edit-existing-keys';
import type {
  ExistingKeys as IExistingKeys,
  PendingKeys as IPendingKeys,
} from '@/smart-contracts/keys/fake-keys-smart-contract';
import { Button } from '@/components/ui/button';
import { ExistingKeys } from '@/pages/operator/sign-up/add-keys/existing-keys';
import { EditExistingKeysForm } from '@/pages/operator/sign-up/add-keys/edit-existing-keys-form';

export function AddKeysOperatorPage() {
  const getKeys = useGetKeys();
  const editExistingKeysMutationState = useEditExistingKeysMutationState();

  const errorAlert = editExistingKeysMutationState?.error ? (
    <Alert color="error" severity="error">
      {defaultErrorMessage(editExistingKeysMutationState.error)}
    </Alert>
  ) : undefined;

  if (getKeys.isError) {
    return <PageCardError errorMessage={defaultErrorMessage(getKeys.error)} />;
  }

  if (getKeys.isPending) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={errorAlert}
      backArrowPath={-1}
      title={t('operator.addKeysPage.title')}
    >
      <Form keysData={getKeys.data} />
    </PageCard>
  );
}

export type UseFormResult = UseFormReturn<
  EditExistingKeysCallArguments,
  unknown
>;

export function Form({
  keysData: {
    pendingKeys,
    existingKeys: { jobTypes, webhookUrl, fee },
  },
}: {
  keysData: {
    pendingKeys: IPendingKeys;
    existingKeys: IExistingKeys;
  };
}) {
  const [editMode, setEditMode] = useState(false);
  const editExistingKeys = useEditExistingKeysMutation();

  const methods = useForm<EditExistingKeysCallArguments>({
    defaultValues: {
      jobTypes,
      webhookUrl,
      fee,
    },
    resolver: zodResolver(editExistingKeysCallArgumentsSchema),
  });

  const handleEdit = (data: EditExistingKeysCallArguments) => {
    editExistingKeys.mutate(data);
  };

  return (
    <Grid container gap="2rem" marginTop="1rem">
      <FormProvider {...methods}>
        <form
          onSubmit={(event) => void methods.handleSubmit(handleEdit)(event)}
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
              useFormResult={methods}
            />
          ) : (
            <ExistingKeys
              openEditMode={setEditMode.bind(null, true)}
              useFormResult={methods}
            />
          )}
          <PendingKeys pendingKeys={pendingKeys} />
          <Button
            disabled={editExistingKeys.isPending}
            fullWidth
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
