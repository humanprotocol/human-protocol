/* eslint-disable camelcase -- ...*/
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import { useJobsNotifications } from '../hooks';
import { useAssignJobMutation } from './hooks/use-assign-job';

interface ThirstyfiInfoModalProps {
  escrow_address: string;
  chain_id: number;
}

export function ThirstyfiInfoModal({
  escrow_address,
  chain_id,
}: ThirstyfiInfoModalProps) {
  const { t } = useTranslation();
  const methods = useForm({
    defaultValues: {
      wallet_address: '',
      api_key: '',
    },
    resolver: zodResolver(
      z.object({
        wallet_address: z
          .string()
          .trim()
          .length(42, t('thirstyfiModal.walletAddressError'))
          .regex(/^0x/, t('thirstyfiModal.walletAddressRegexError')),
        api_key: z.string().trim().min(1, t('validation.required')),
      })
    ),
  });
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();
  const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
    {
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    },
    [`assignJob-${escrow_address}`]
  );

  const onSubmit = (data: { wallet_address: string; api_key: string }) => {
    assignJobMutation({ escrow_address, chain_id, ...data });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void methods.handleSubmit(onSubmit)(event);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit}>
        <Stack gap={3}>
          <Typography variant="h4" textAlign="center">
            {t('thirstyfiModal.title')}
          </Typography>
          <Input
            fullWidth
            label={t('thirstyfiModal.walletAddress')}
            name="wallet_address"
          />
          <Input fullWidth label={t('thirstyfiModal.apiKey')} name="api_key" />
          <Button variant="contained" type="submit" loading={isPending}>
            {t('thirstyfiModal.submitBtn')}
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
}
