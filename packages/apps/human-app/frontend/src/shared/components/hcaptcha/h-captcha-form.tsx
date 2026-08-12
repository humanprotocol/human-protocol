import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';

import { ApiClientError } from '@/api';
import { CustomHCaptcha, type CustomHCaptchaRef } from './h-captcha';

interface HCaptchaFormProps {
  name: string;
  error?: unknown;
}

export function HCaptchaForm({ name, error }: Readonly<HCaptchaFormProps>) {
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
        component="div"
        variant="helperText"
        sx={{ color: 'error.main' }}
      >
        {formState.errors[name]?.message}
      </Typography>
    </div>
  );
}
