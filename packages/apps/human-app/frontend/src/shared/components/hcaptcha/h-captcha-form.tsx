import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';
import { useColorMode } from '@/shared/contexts/color-mode';
import { ApiClientError } from '@/api';
import { CustomHCaptcha, type CustomHCaptchaRef } from './h-captcha';

interface HCaptchaFormProps {
  name: string;
  error?: unknown;
}

export function HCaptchaForm({ name, error }: Readonly<HCaptchaFormProps>) {
  const { colorPalette } = useColorMode();
  const { setValue, formState } = useFormContext<Record<string, unknown>>();
  const customCaptchaRef = useRef<CustomHCaptchaRef>(null);

  function setCaptchaValue(token: string) {
    setValue(name, token);
  }

  useEffect(() => {
    if (error instanceof ApiClientError) {
      setValue(name, '');
      customCaptchaRef.current?.reset();
    }
  }, [error, name, setValue]);

  return (
    <div>
      <CustomHCaptcha onVerify={setCaptchaValue} ref={customCaptchaRef} />
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
