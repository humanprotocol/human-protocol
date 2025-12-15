import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
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

interface EditApiKeyModalProps {
  onClose: () => void;
}

export function EditApiKeyModal({ onClose }: EditApiKeyModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      exchange: '',
      apiKey: '',
      apiSecret: '',
    },
    resolver: zodResolver(
      z.object({
        exchange: z.string().min(1, t('validation.required')),
        apiKey: z.string().min(1, t('validation.required')),
        apiSecret: z.string().min(1, t('validation.required')),
      })
    ),
  });

  const onSubmit = (data: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
  }) => {
    console.log(data);
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
                  {...field}
                  options={[]}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('worker.profile.apiKeyData.exchange')}
                    />
                  )}
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
        <FormControl error={!!errors.apiSecret} sx={{ mt: { xs: 0, md: 1 } }}>
          <Controller
            name="apiSecret"
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
