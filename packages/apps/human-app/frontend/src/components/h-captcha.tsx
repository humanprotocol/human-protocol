import { useEffect, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';
import { env } from '@/shared/env';
import { colorPalette } from '@/styles/color-palette';
import { FetchError } from '@/api/fetcher';

interface CaptchaProps {
  setCaptchaToken: (token: string) => void;
  error?: unknown;
}

export function Captcha({ setCaptchaToken, error }: CaptchaProps) {
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (error instanceof FetchError) {
      captchaRef.current?.resetCaptcha();
    }
  }, [error]);

  return (
    <HCaptcha
      onVerify={setCaptchaToken}
      ref={captchaRef}
      sitekey={env.VITE_H_CAPTCHA_SITE_KEY}
    />
  );
}

interface FormCaptchaProps {
  name: string;
  error?: unknown;
}

export function FormCaptcha({ name, error }: FormCaptchaProps) {
  const { setValue, formState } = useFormContext<Record<string, unknown>>();

  function setCaptchaToken(token: string) {
    setValue(name, token);
  }

  useEffect(() => {
    if (error instanceof FetchError) {
      setValue(name, '');
    }
  }, [error, name, setValue]);

  return (
    <div>
      <Captcha error={error} setCaptchaToken={setCaptchaToken} />
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
