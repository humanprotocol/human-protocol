import { t } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import type { GetEthKVStoreValuesSuccessResponse } from '@/modules/operator/hooks/use-get-keys';
import { useResetMutationErrors } from '@/shared/hooks/use-reset-mutation-errors';
import { useEditExistingKeysMutation } from '../../hooks';
import {
  type EditEthKVStoreValuesMutationData,
  setEthKVStoreValuesMutationSchema,
} from '../../schema';
import { EditPendingKeysForm } from './edit-pending-keys-form';

export function PendingKeysForm({
  keysData,
}: Readonly<{
  keysData: GetEthKVStoreValuesSuccessResponse;
}>) {
  const pendingKeysMutation = useEditExistingKeysMutation();

  const pendingKeysMethods = useForm({
    defaultValues: {},
    resolver: zodResolver(setEthKVStoreValuesMutationSchema(keysData)),
  });

  const handleEditPendingKey = (data: EditEthKVStoreValuesMutationData) => {
    pendingKeysMutation.mutate(data);
  };

  useResetMutationErrors(pendingKeysMethods.watch, pendingKeysMutation.reset);

  return (
    <FormProvider {...pendingKeysMethods}>
      <form
        onSubmit={(event) => {
          void pendingKeysMethods.handleSubmit(handleEditPendingKey)(event);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        <EditPendingKeysForm existingKeysInitialState={keysData} />

        <Button
          fullWidth
          loading={pendingKeysMutation.isPending}
          sx={{ mt: '10px' }}
          type="submit"
          variant="contained"
        >
          {t('operator.addKeysPage.btn')}
        </Button>
      </form>
    </FormProvider>
  );
}
