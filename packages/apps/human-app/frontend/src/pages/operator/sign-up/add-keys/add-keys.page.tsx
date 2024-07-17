import { Grid } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import {
  PageCard,
  PageCardError,
  PageCardLoader,
} from '@/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { Alert } from '@/components/ui/alert';
import type { EditEthKVStoreValuesMutationData } from '@/api/servieces/operator/edit-existing-keys';
import { useEditExistingKeysMutationState } from '@/api/servieces/operator/edit-existing-keys';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';
import { useGetKeys } from '@/api/servieces/operator/get-keys';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';
import { ExistingKeysForm } from '@/pages/operator/sign-up/add-keys/existing-keys-form';
import { PendingKeysForm } from '@/pages/operator/sign-up/add-keys/pending-keys-form';
import { Button } from '@/components/ui/button';
import { routerPaths } from '@/router/router-paths';

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
    return <PageCardError errorMessage={defaultErrorMessage(getKeysError)} />;
  }

  if (isGetKeysPending) {
    return <PageCardLoader />;
  }

  return (
    <PageCard alert={errorAlert} title={t('operator.addKeysPage.title')}>
      <Form keysData={keysData} />
    </PageCard>
  );
}

export function Form({
  keysData,
}: {
  keysData: GetEthKVStoreValuesSuccessResponse;
}) {
  const areSomeExistingKeys = Object.values(keysData).filter(Boolean).length;
  const areSomePendingKeys = Object.entries(keysData).filter(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it's necessary
    ([key, values]) => key && !values?.length
  ).length;

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
        {areSomeExistingKeys ? <ExistingKeysForm keysData={keysData} /> : null}
        {areSomePendingKeys ? <PendingKeysForm keysData={keysData} /> : null}
        {areSomeExistingKeys && !areSomePendingKeys ? (
          <Button
            component={Link}
            to={routerPaths.operator.editExistingKeysSuccess}
            variant="contained"
          >
            {t('operator.addKeysPage.skipBtn')}
          </Button>
        ) : null}
      </div>
    </Grid>
  );
}
