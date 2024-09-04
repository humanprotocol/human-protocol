import { t } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import type { EditEthKVStoreValuesMutationData } from '@/api/services/operator/edit-existing-keys';
import {
  setEthKVStoreValuesMutationSchema,
  useEditExistingKeysMutation,
} from '@/api/services/operator/edit-existing-keys';
import { Button } from '@/components/ui/button';
import { EditPendingKeysForm } from '@/pages/operator/sign-up/add-keys/edit-pending-keys-form';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/services/operator/get-keys';
import { useResetMutationErrors } from '@/hooks/use-reset-mutation-errors';

export function PendingKeysForm({
  keysData,
}: {
  keysData: GetEthKVStoreValuesSuccessResponse;
}) {
  const pendingKeysMutation = useEditExistingKeysMutation();

  const pendingKeysMethods = useForm<
    GetEthKVStoreValuesSuccessResponse,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
    any,
    EditEthKVStoreValuesMutationData
  >({
    defaultValues: {},
    resolver: zodResolver(setEthKVStoreValuesMutationSchema(keysData)),
  });

  const handleEditPendingKey = (data: EditEthKVStoreValuesMutationData) => {
    pendingKeysMutation.mutate(data);
  };

  useResetMutationErrors(pendingKeysMethods.watch, pendingKeysMutation.reset);

  return (
    <FormProvider<
      GetEthKVStoreValuesSuccessResponse,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- automatic inferring
      any,
      EditEthKVStoreValuesMutationData
    >
      {...pendingKeysMethods}
    >
      <form
        onSubmit={(event) => {
          void pendingKeysMethods.handleSubmit(handleEditPendingKey)(event);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <EditPendingKeysForm existingKeysInitialState={keysData} />

        <Button
          fullWidth
          loading={pendingKeysMutation.isPending}
          type="submit"
          variant="contained"
        >
          {t('operator.addKeysPage.btn')}
        </Button>
      </form>
    </FormProvider>
  );
}
