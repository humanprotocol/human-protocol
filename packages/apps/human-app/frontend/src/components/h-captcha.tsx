import { useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useFormContext } from 'react-hook-form';
import { Typography } from '@mui/material';
import { env } from '@/shared/env';
import { colorPalette } from '@/styles/color-palette';

interface CaptchaProps {
  setCaptchaToken: (token: string) => void;
}

export function Captcha({ setCaptchaToken }: CaptchaProps) {
  const captchaRef = useRef<HCaptcha>(null);

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
}

export function FormCaptcha({ name }: FormCaptchaProps) {
  const { setValue, formState } = useFormContext<Record<string, unknown>>();

  function setCaptchaToken(token: string) {
    setValue(name, token);
  }

  return (
    <div>
      <Captcha setCaptchaToken={setCaptchaToken} />
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
