import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks';
import { useDeleteExchangeApiKeys } from '../../hooks/use-exchange-api-keys';
import { useEffect } from 'react';
import { ModalError, ModalSuccess, ModalLoading } from './modal-states';

interface DeleteApiKeyModalProps {
  onClose: () => void;
  disableClose: (disable: boolean) => void;
}

export function DeleteApiKeyModal({
  onClose,
  disableClose,
}: DeleteApiKeyModalProps) {
  const { t } = useTranslation();
  const {
    mutate: deleteExchangeApiKey,
    reset: resetMutation,
    isSuccess,
    isError,
    isPending,
    isIdle,
  } = useDeleteExchangeApiKeys();
  const isMobile = useIsMobile();

  const handleDeleteExchangeApiKey = () => {
    deleteExchangeApiKey();
  };

  useEffect(() => {
    disableClose(isPending);
  }, [isPending, disableClose]);

  useEffect(() => {
    return () => {
      resetMutation();
    };
  }, [resetMutation]);

  return (
    <Stack>
      <Typography variant="h4" textAlign="center" p={1} mb={2}>
        {t('worker.profile.apiKeyData.deleteApiKey')}
      </Typography>
      {isPending && <ModalLoading />}
      {isIdle && (
        <>
          <Typography variant="h6" textAlign="center" mb={1}>
            {t('worker.profile.apiKeyData.deleteApiKeyConfirmation')}
          </Typography>
          <Typography variant="body2" textAlign="center" mb={{ xs: 2, md: 4 }}>
            {t('worker.profile.apiKeyData.deleteApiKeyDescription')}
          </Typography>
        </>
      )}
      {isSuccess && (
        <ModalSuccess>
          <Typography variant="body2" textAlign="center" my={2}>
            {t('worker.profile.apiKeyData.deleteKeySuccess')}
          </Typography>
        </ModalSuccess>
      )}
      {isError && (
        <ModalError message={t('worker.profile.apiKeyData.deleteKeyError')} />
      )}
      {isIdle && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={2}
          width="100%"
          justifyContent="center"
        >
          <Button
            variant="contained"
            size="large"
            fullWidth={isMobile}
            onClick={onClose}
          >
            {t('worker.profile.apiKeyData.cancel')}
          </Button>
          <Button
            variant="contained"
            size="large"
            fullWidth={isMobile}
            sx={{ bgcolor: 'primary.light' }}
            onClick={handleDeleteExchangeApiKey}
          >
            {t('worker.profile.apiKeyData.deleteApiKey')}
          </Button>
        </Stack>
      )}
      {(isPending || isSuccess) && (
        <Button
          variant="contained"
          size="large"
          sx={{ width: { xs: '100%', md: 'fit-content' }, mx: 'auto', mt: 2 }}
          onClick={isPending ? undefined : onClose}
          disabled={isPending}
        >
          {t('worker.profile.apiKeyData.close')}
        </Button>
      )}
      {isError && (
        <Button
          variant="contained"
          size="large"
          sx={{ width: { xs: '100%', md: 'fit-content' }, mx: 'auto' }}
          onClick={resetMutation}
        >
          {t('worker.profile.apiKeyData.tryAgain')}
        </Button>
      )}
    </Stack>
  );
}
