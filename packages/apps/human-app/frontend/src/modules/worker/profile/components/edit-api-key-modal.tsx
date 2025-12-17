import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks';
import { useEffect } from 'react';
import {
  useEnrollExchangeApiKeys,
  useGetSupportedExchanges,
} from '../../hooks/use-exchange-api-keys';

interface EditApiKeyModalProps {
  exchangeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditApiKeyModal({
  isOpen,
  onClose,
  exchangeName,
}: EditApiKeyModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { mutate: postExchangeApiKey } = useEnrollExchangeApiKeys();
  const { data: supportedExchanges } = useGetSupportedExchanges();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      exchange: '',
      apiKey: '',
      secretKey: '',
    },
    resolver: zodResolver(
      z.object({
        exchange: z.string().min(1, t('validation.required')),
        apiKey: z.string().min(1, t('validation.required')),
        secretKey: z.string().min(1, t('validation.required')),
      })
    ),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        exchange: exchangeName,
        apiKey: '',
        secretKey: '',
      });
    }
  }, [isOpen, exchangeName, reset]);

  const onSubmit = (data: {
    exchange: string;
    apiKey: string;
    secretKey: string;
  }) => {
    postExchangeApiKey(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={2}>
        <Typography variant="h4" textAlign="center" p={1}>
          {t('worker.profile.apiKeyData.editApiKey')}
        </Typography>
        <Typography variant="body2" textAlign="center" p={{ xs: 1, md: 0 }}>
          {t('worker.profile.apiKeyData.modalDescription')}
        </Typography>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          gap={{ xs: 2, md: 1 }}
          width="100%"
        >
          <FormControl
            error={!!errors.exchange}
            sx={{ width: { xs: '100%', md: '30%' } }}
          >
            <Controller
              name="exchange"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={
                    supportedExchanges?.map((exchange) => exchange.name) || []
                  }
                  getOptionLabel={(option) => {
                    const exchange = supportedExchanges?.find(
                      (exchange) => exchange.name === option
                    );
                    return exchange?.displayName || option || '';
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('worker.profile.apiKeyData.exchange')}
                    />
                  )}
                  renderOption={(props, option) => {
                    const exchange = supportedExchanges?.find(
                      (exchange) => exchange.name === option
                    );
                    return (
                      <Box {...props} key={option} component="li">
                        <Typography
                          color="text.primary"
                          variant="body1"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {exchange?.displayName || exchange?.name}
                        </Typography>
                      </Box>
                    );
                  }}
                  {...field}
                  disabled
                  onChange={(_, value) => field.onChange(value)}
                />
              )}
            />
            {errors.exchange && (
              <FormHelperText error>{errors.exchange.message}</FormHelperText>
            )}
          </FormControl>
          <FormControl
            error={!!errors.exchange}
            sx={{ width: { xs: '100%', md: '70%' } }}
          >
            <Controller
              name="apiKey"
              control={control}
              render={({ field }) => (
                <TextField
                  type="text"
                  label={t('worker.profile.apiKeyData.apiKey')}
                  placeholder={t('worker.profile.apiKeyData.apiKey')}
                  multiline={isMobile}
                  minRows={1}
                  maxRows={4}
                  {...field}
                />
              )}
            />
            {errors.apiKey && (
              <FormHelperText error>{errors.apiKey.message}</FormHelperText>
            )}
          </FormControl>
        </Stack>
        <FormControl error={!!errors.secretKey} sx={{ mt: { xs: 0, md: 1 } }}>
          <Controller
            name="secretKey"
            control={control}
            render={({ field }) => (
              <TextField
                type="password"
                autoComplete="new-password" // disables autofill from browser
                label={t('worker.profile.apiKeyData.apiSecret')}
                placeholder={t('worker.profile.apiKeyData.apiSecret')}
                {...field}
              />
            )}
          />
        </FormControl>
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
            type="submit"
            variant="contained"
            size="large"
            fullWidth={isMobile}
            sx={{ bgcolor: 'primary.light' }}
          >
            {t('worker.profile.apiKeyData.saveChanges')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
