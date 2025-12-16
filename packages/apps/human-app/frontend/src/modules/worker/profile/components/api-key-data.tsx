import { IconButton, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/shared/components/ui/chip';
import { CustomTextField, CustomTextFieldDark } from './custom-text-field';
import { useColorMode } from '@/shared/contexts/color-mode';
import { DeleteIcon, EditIcon } from '@/shared/components/ui/icons';
import {
  useDeleteApiKeyModal,
  useEditApiKeyModal,
} from '../hooks/use-api-key-modals';
import { useGetExchangeApiKeys } from '../../hooks/use-exchange-api-keys';

export function ApiKeyData() {
  const { isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const { openModal: openEditApiKeyModal } = useEditApiKeyModal();
  const { openModal: openDeleteApiKeyModal } = useDeleteApiKeyModal();
  const { data: exchangeApiKey } = useGetExchangeApiKeys();

  const textField = isDarkMode ? (
    <CustomTextFieldDark
      disabled
      fullWidth
      placeholder={t('worker.profile.apiKeyData.connectApiKey')}
    />
  ) : (
    <CustomTextField
      disabled
      fullWidth
      placeholder={t('worker.profile.apiKeyData.connectApiKey')}
    />
  );

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.apiKeyData.apiKey')}
        </Typography>
        <Chip
          label={t('worker.profile.apiKeyData.apiKeyNotConnected')}
          backgroundColor="warning.main"
        />
      </Stack>
      <Stack gap={2} direction="row" alignItems="center">
        {textField}
        <Stack
          display={exchangeApiKey ? 'flex' : 'none'}
          direction="row"
          alignItems="center"
          gap={1}
        >
          <IconButton
            disableRipple
            sx={{ p: 0, '&:hover': { bgcolor: 'inherit' } }}
            onClick={openEditApiKeyModal}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            disableRipple
            sx={{ p: 0, '&:hover': { bgcolor: 'inherit' } }}
            onClick={openDeleteApiKeyModal}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
}
