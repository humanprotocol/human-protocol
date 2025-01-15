import { Grid } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import {
  PageCardError,
  PageCardLoader,
  PageCard,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError, jsonRpcErrorHandler } from '@/shared/errors';
import type { EditEthKVStoreValuesMutationData } from '@/modules/operator/hooks/use-edit-existing-keys';
import { useEditExistingKeysMutationState } from '@/modules/operator/hooks/use-edit-existing-keys';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { useGetKeys } from '@/modules/operator/hooks/use-get-keys';
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
      {getErrorMessageForError(
        editExistingKeysMutationState.error,
        jsonRpcErrorHandler
      )}
    </Alert>
  ) : undefined;

  if (isGetKeysError) {
    return (
      <PageCardError errorMessage={getErrorMessageForError(getKeysError)} />
    );
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
  const hasSomeNotEmptyKeys =
    Object.values(keysData).filter(Boolean).length > 0;
  const hasSomePendingKeys =
    Object.values(keysData).filter((value) => {
      /**
       * This check is necessary because TS can't infer
       * "undefined" from optional object's property
       */
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (value === undefined) {
        return false;
      }

      return value.length === 0;
    }).length > 0;

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
        {hasSomeNotEmptyKeys ? <ExistingKeysForm keysData={keysData} /> : null}
        {hasSomePendingKeys ? <PendingKeysForm keysData={keysData} /> : null}
        {hasSomeNotEmptyKeys && !hasSomePendingKeys ? (
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
