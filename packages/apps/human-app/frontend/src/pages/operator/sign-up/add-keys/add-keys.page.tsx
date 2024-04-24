import { useEffect, useState } from 'react';
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
import { useWalletConnect } from '@/hooks/use-wallet-connect';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';
import { useGetKeysMutation } from '@/api/servieces/operator/get-keys';
import { PendingKeys } from '@/pages/operator/sign-up/add-keys/pending-keys';
import type { EditExistingKeysCallArguments } from '@/api/servieces/operator/edit-existing-keys';
import {
  editExistingKeysCallArgumentsSchema,
  useEditExistingKeysMutation,
} from '@/api/servieces/operator/edit-existing-keys';
import type {
  ExistingKeys as IExistingKeys,
  PendingKeys as IPendingKeys,
} from '@/smart-contracts/keys/fake-keys-smart-contract';
import { Button } from '@/components/ui/button';
import { EditKeysForm } from '@/pages/operator/sign-up/add-keys/edit-keys-form';
import { ExistingKeys } from '@/pages/operator/sign-up/add-keys/existing-keys';

export function AddKeysOperatorPage() {
  const { address } = useWalletConnect();

  const {
    mutate: getKeysOperatorMutate,
    error: getKeysOperatorError,
    isError: isGetKeysOperatorError,
    data: keysData,
    isPending: isGetKeysOperatorPending,
  } = useGetKeysMutation();

  const errorAlert = isGetKeysOperatorError ? (
    <Alert color="error" severity="error">
      {defaultErrorMessage(isGetKeysOperatorError)}
    </Alert>
  ) : undefined;

  const handleAddressChange = (_address: string) => {
    getKeysOperatorMutate({ address: _address });
  };

  useEffect(() => {
    if (address) {
      handleAddressChange(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- no nesseccary
  }, [address]);

  useEffect(() => {
    getKeysOperatorMutate({ address: address || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- use once
  }, []);

  if (getKeysOperatorError) {
    return (
      <PageCardError errorMessage={defaultErrorMessage(getKeysOperatorError)} />
    );
  }

  if (isGetKeysOperatorPending || !keysData) {
    return <PageCardLoader />;
  }

  return (
    <PageCard
      alert={errorAlert}
      backArrowPath={-1}
      title={t('operator.addKeysPage.title')}
    >
      <Form address={address} keysData={keysData} />
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
  address,
}: {
  keysData: {
    pendingKeys: IPendingKeys;
    existingKeys: IExistingKeys;
  };
  address: `0x${string}` | undefined;
}) {
  const [editMode, setEditMode] = useState(false);
  const {
    mutate: editExistingKeysOperatorMutate,
    // error: editExistingKeysOperatorError,
    // isError: isEditExistingKeysOperatorError,
    isPending: isEditExistingKeysPending,
  } = useEditExistingKeysMutation();

  const methods = useForm<EditExistingKeysCallArguments>({
    defaultValues: {
      jobTypes,
      webhookUrl,
      fee,
    },
    resolver: zodResolver(editExistingKeysCallArgumentsSchema),
  });

  const handleEdit = (data: EditExistingKeysCallArguments) => {
    editExistingKeysOperatorMutate({ ...data, address: address || '' });
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
            <EditKeysForm
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
            disabled={isEditExistingKeysPending}
            fullWidth
            type="submit"
            variant="contained"
          >
            Add New Keys to KVStore
          </Button>
        </form>
      </FormProvider>
    </Grid>
  );
}
