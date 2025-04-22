import { t } from 'i18next';
import {
  PageCardError,
  PageCardLoader,
  PageCard,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError, jsonRpcErrorHandler } from '@/shared/errors';
import { Alert } from '@/shared/components/ui/alert';
import { useGetKeys } from '@/modules/operator/hooks';
import { useEditExistingKeysMutationState } from '../hooks';
import { AddKeysForm } from '../components/add-keys';

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
      <AddKeysForm keysData={keysData} />
    </PageCard>
  );
}
