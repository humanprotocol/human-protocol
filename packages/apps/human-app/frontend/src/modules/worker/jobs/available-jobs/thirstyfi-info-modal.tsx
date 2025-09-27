/* eslint-disable camelcase -- ...*/
import { z } from 'zod';
import { FormProvider, useForm } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from '@mui/material/Link';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/data-entry/input';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useJobsNotifications } from '../hooks';
import { useAssignJobMutation } from './hooks/use-assign-job';

interface ThirstyfiInfoModalProps {
  escrow_address: string;
  chain_id: number;
  onClose?: () => void;
}

export function ThirstyfiInfoModal({
  escrow_address,
  chain_id,
  onClose,
}: ThirstyfiInfoModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const methods = useForm({
    defaultValues: {
      wallet_address: '',
      api_key: '',
      api_secret: '',
    },
    resolver: zodResolver(
      z.object({
        wallet_address: z
          .string()
          .trim()
          .length(42, t('thirstyfiModal.walletAddressError'))
          .regex(/^0x/, t('thirstyfiModal.walletAddressRegexError')),
        api_key: z.string().trim().min(1, t('validation.required')),
        api_secret: z.string().trim().min(1, t('validation.required')),
      })
    ),
  });

  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();
  const queryClient = useQueryClient();

  const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
    {
      onSuccess: () => {
        const queryKey = isMobile
          ? ['availableJobsInfinite']
          : ['availableJobs'];
        onJobAssignmentSuccess();
        void queryClient.invalidateQueries({ queryKey }).then(() => {
          methods.reset();
          onClose?.();
        });
      },
      onError: onJobAssignmentError,
    },
    [`assignJob-${escrow_address}`]
  );

  const onSubmit = (data: {
    wallet_address: string;
    api_key: string;
    api_secret: string;
  }) => {
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
          <Typography variant="h6" textAlign="center">
            {t('thirstyfiModal.tutorialText1')}
            <Link
              href="https://thirsty.fi"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('thirstyfiModal.tutorialLink')}
            </Link>
            {t('thirstyfiModal.tutorialText2')}
          </Typography>
          <Stack gap={0.5}>
            <Input
              fullWidth
              label={t('thirstyfiModal.walletAddress')}
              name="wallet_address"
            />
            <Typography variant="caption" color="text.secondary">
              {t('thirstyfiModal.walletAddressHelp', {
                defaultValue: t('thirstyfiModal.walletAddressTooltip'),
              })}
            </Typography>
          </Stack>
          <Stack gap={0.5}>
            <Input
              fullWidth
              label={t('thirstyfiModal.apiKey')}
              name="api_key"
            />
            <Typography variant="caption" color="text.secondary">
              {t('thirstyfiModal.apiKeyHelp', {
                defaultValue: t('thirstyfiModal.apiKeyTooltip'),
              })}
            </Typography>
          </Stack>
          <Stack gap={0.5}>
            <Input
              fullWidth
              label={t('thirstyfiModal.apiSecret')}
              name="api_secret"
            />
            <Typography variant="caption" color="text.secondary">
              {t('thirstyfiModal.apiSecretHelp', {
                defaultValue: t('thirstyfiModal.apiSecretTooltip'),
              })}
            </Typography>
          </Stack>
          <Button variant="contained" type="submit" loading={isPending}>
            {t('thirstyfiModal.submitBtn')}
          </Button>
        </Stack>
      </form>
    </FormProvider>
  );
}
