import { Grid } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import { PageCardError } from '@/shared/components/ui/page-card-error';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';
import { PageCard } from '@/shared/components/ui/page-card';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { EditEthKVStoreValuesMutationData } from '@/modules/operator/hooks/use-edit-existing-keys';
import { useEditExistingKeysMutationState } from '@/modules/operator/hooks/use-edit-existing-keys';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { useGetKeys } from '@/modules/operator/hooks/use-get-keys';
import { jsonRpcErrorHandler } from '@/shared/helpers/json-rpc-error-handler';
import { routerPaths } from '@/router/router-paths';
import { ExistingKeysForm } from '@/modules/operator/components/sign-up/add-keys/existing-keys-form';
import { PendingKeysForm } from '@/modules/operator/components/sign-up/add-keys/pending-keys-form';
import { Button } from '@/shared/components/ui/button';
import { Alert } from '@/shared/components/ui/alert';

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
    ([key, values]) => key && !values.length
  ).length;

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
