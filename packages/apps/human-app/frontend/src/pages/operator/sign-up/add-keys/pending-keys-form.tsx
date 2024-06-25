import { t } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import type { EditEthKVStoreValuesMutationData } from '@/api/servieces/operator/edit-existing-keys';
import {
  editEthKVStoreValuesMutationSchema,
  useEditExistingKeysMutation,
} from '@/api/servieces/operator/edit-existing-keys';
import { Button } from '@/components/ui/button';
import { EditPendingKeysForm } from '@/pages/operator/sign-up/add-keys/edit-pending-keys-form';
import type { GetEthKVStoreValuesSuccessResponse } from '@/api/servieces/operator/get-keys';

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
    resolver: zodResolver(editEthKVStoreValuesMutationSchema),
  });

  const handleEditPendingKey = (data: EditEthKVStoreValuesMutationData) => {
    pendingKeysMutation.mutate(data);
  };

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
