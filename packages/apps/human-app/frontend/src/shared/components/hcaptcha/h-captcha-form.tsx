import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';
import { FetchError } from '@/api/fetcher';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { CustomHCaptcha } from './h-captcha';

interface HCaptchaFormProps {
  name: string;
  error?: unknown;
}

export function HCaptchaForm({ name, error }: HCaptchaFormProps) {
  const { colorPalette } = useColorMode();
  const { setValue, formState } = useFormContext<Record<string, unknown>>();

  function onVerify(token: string) {
    setValue(name, token);
  }

  useEffect(() => {
    if (error instanceof FetchError) {
      setValue(name, '');
    }
  }, [error, name, setValue]);

  return (
    <div>
      <CustomHCaptcha error={error} onVerify={onVerify} />
      <Typography
        color={colorPalette.error.main}
        component="div"
        variant="helperText"
      >
        {formState.errors[name]?.message}
      </Typography>
    </div>
  );
}
