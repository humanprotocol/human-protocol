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
import {
  useEnrollExchangeApiKeys,
  useGetSupportedExchanges,
} from '../../hooks/use-exchange-api-keys';
import { ModalError, ModalLoading, ModalSuccess } from './modal-states';
import { useEffect } from 'react';

interface AddApiKeyModalProps {
  onClose: () => void;
  disableClose: (disable: boolean) => void;
}

export function AddApiKeyModal({ onClose, disableClose }: AddApiKeyModalProps) {
  const { t } = useTranslation();
  const {
    mutate: enrollExchangeApiKey,
    reset: resetMutation,
    error,
    isSuccess,
    isPending,
    isError,
    isIdle,
  } = useEnrollExchangeApiKeys();
  const isMobile = useIsMobile();
  const { data: supportedExchanges } = useGetSupportedExchanges();

  useEffect(() => {
    disableClose(isPending);
  }, [isPending, disableClose]);

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
        apiKey: z.string().trim().min(1, t('validation.required')),
        secretKey: z.string().trim().min(1, t('validation.required')),
      })
    ),
  });

  useEffect(() => {
    return () => {
      reset();
      resetMutation();
    };
  }, [reset, resetMutation]);

  const onSubmit = (data: {
    exchange: string;
    apiKey: string;
    secretKey: string;
  }) => {
    enrollExchangeApiKey(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={2}>
        <Typography variant="h4" textAlign="center" p={1}>
          {isMobile
            ? t('worker.profile.apiKeyData.connectApiKey')
            : t('worker.profile.apiKeyData.connectYourApiKey')}
        </Typography>
        {isPending && <ModalLoading />}
        {isIdle && (
          <>
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
                        supportedExchanges?.map((exchange) => exchange.name) ||
                        []
                      }
                      getOptionLabel={(option) => {
                        const exchange = supportedExchanges?.find(
                          (exchange) => exchange.name === option
                        );
                        return exchange?.display_name || option || '';
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
                              {exchange?.display_name || exchange?.name}
                            </Typography>
                          </Box>
                        );
                      }}
                      {...field}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  )}
                />
                {errors.exchange && (
                  <FormHelperText error>
                    {errors.exchange.message}
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl
                error={!!errors.apiKey}
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
                      {...field}
                    />
                  )}
                />
                {errors.apiKey && (
                  <FormHelperText error>{errors.apiKey.message}</FormHelperText>
                )}
              </FormControl>
            </Stack>
            <FormControl
              error={!!errors.secretKey}
              sx={{ mt: { xs: 0, md: 1 } }}
            >
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
              {errors.secretKey && (
                <FormHelperText error>
                  {errors.secretKey.message}
                </FormHelperText>
              )}
            </FormControl>
          </>
        )}
        {isSuccess && (
          <ModalSuccess>
            <Typography variant="body2" textAlign="center">
              {t('worker.profile.apiKeyData.connectSuccess')}
            </Typography>
          </ModalSuccess>
        )}
        {isError && (
          <ModalError
            message={
              typeof error?.message === 'string'
                ? error?.message
                : t('worker.profile.apiKeyData.connectError')
            }
          />
        )}
        {isIdle && (
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{ width: { xs: '100%', md: 'fit-content' }, mx: 'auto' }}
          >
            {t('worker.profile.apiKeyData.connectApiKey')}
          </Button>
        )}
        {(isPending || isSuccess) && (
          <Button
            variant="contained"
            size="large"
            disabled={isPending}
            sx={{ width: { xs: '100%', md: 'fit-content' }, mx: 'auto' }}
            onClick={onClose}
          >
            {t('worker.profile.apiKeyData.close')}
          </Button>
        )}
        {isError && (
          <Button
            variant="contained"
            size="large"
            fullWidth={isMobile}
            sx={{ width: 'fit-content', mx: 'auto' }}
            onClick={resetMutation}
          >
            {t('worker.profile.apiKeyData.edit')}
          </Button>
        )}
        <Typography variant="caption" textAlign="center">
          {t('worker.profile.apiKeyData.modalFooterAgreement')}
        </Typography>
      </Stack>
    </form>
  );
}
