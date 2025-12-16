import { Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks';
import { useDeleteExchangeApiKeys } from '../../hooks/use-exchange-api-keys';

interface DeleteApiKeyModalProps {
  onClose: () => void;
}

export function DeleteApiKeyModal({ onClose }: DeleteApiKeyModalProps) {
  const { t } = useTranslation();
  const { mutate: deleteExchangeApiKey } = useDeleteExchangeApiKeys();
  const isMobile = useIsMobile();

  const handleDeleteExchangeApiKey = () => {
    deleteExchangeApiKey();
  };

  return (
    <Stack>
      <Typography variant="h4" textAlign="center" p={1} mb={2}>
        {t('worker.profile.apiKeyData.deleteApiKey')}
      </Typography>
      <Typography variant="h6" textAlign="center" mb={1}>
        {t('worker.profile.apiKeyData.deleteApiKeyConfirmation')}
      </Typography>
      <Typography variant="body2" textAlign="center" mb={{ xs: 2, md: 4 }}>
        {t('worker.profile.apiKeyData.deleteApiKeyDescription')}
      </Typography>
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
    </Stack>
  );
}
