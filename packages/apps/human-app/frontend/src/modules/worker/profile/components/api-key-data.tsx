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

export function ApiKeyData({
  stakingExchangeError,
}: {
  stakingExchangeError?: string;
}) {
  const { isDarkMode } = useColorMode();
  const { t } = useTranslation();
  const { openModal: openEditApiKeyModal } = useEditApiKeyModal();
  const { openModal: openDeleteApiKeyModal } = useDeleteApiKeyModal();
  const { data: exchangeApiKeyData, isError: isExchangeApiKeyError } =
    useGetExchangeApiKeys();

  const textField = isDarkMode ? (
    <CustomTextFieldDark
      value={exchangeApiKeyData?.api_key || ''}
      disabled
      fullWidth
      placeholder={t('worker.profile.apiKeyData.connectApiKey')}
      sx={{
        '& .MuiInputBase-input': {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        },
      }}
    />
  ) : (
    <CustomTextField
      value={exchangeApiKeyData?.api_key || ''}
      disabled
      fullWidth
      placeholder={t('worker.profile.apiKeyData.connectApiKey')}
      sx={{
        '& .MuiInputBase-input': {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        },
      }}
    />
  );

  return (
    <Stack gap={1}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="buttonLarge">
          {t('worker.profile.apiKeyData.apiKey')}
        </Typography>
        <Chip
          label={
            isExchangeApiKeyError || stakingExchangeError
              ? t('worker.profile.apiKeyData.error')
              : exchangeApiKeyData?.exchange_name
                ? t('worker.profile.apiKeyData.apiKeyConnected')
                : t('worker.profile.apiKeyData.apiKeyNotConnected')
          }
          backgroundColor={
            isExchangeApiKeyError || stakingExchangeError
              ? 'error.main'
              : exchangeApiKeyData?.exchange_name
                ? 'success.main'
                : 'warning.main'
          }
        />
      </Stack>
      <Stack gap={2} direction="row" alignItems="center">
        {textField}
        {exchangeApiKeyData?.exchange_name && (
          <Stack direction="row" alignItems="center" gap={1}>
            <IconButton
              disableRipple
              sx={{ p: 0, '&:hover': { bgcolor: 'inherit' } }}
              onClick={() =>
                openEditApiKeyModal(exchangeApiKeyData.exchange_name)
              }
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
        )}
      </Stack>
    </Stack>
  );
}
