import { useEffect, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { env } from '@/shared/env';
import { FetchError } from '@/api/fetcher';
import { useColorMode } from '@/shared/hooks/use-color-mode';

interface CustomHCaptchaProps {
  onVerify: (token: string) => void;
  error?: unknown;
}

export function CustomHCaptcha({ onVerify, error }: CustomHCaptchaProps) {
  const { isDarkMode } = useColorMode();
  const captchaRef = useRef<HCaptcha>(null);

  useEffect(() => {
    if (error instanceof FetchError) {
      captchaRef.current?.resetCaptcha();
    }
  }, [error]);

  return (
    <HCaptcha
      onVerify={(token: string) => {
        onVerify(token);
      }}
      ref={captchaRef}
      sitekey={env.VITE_H_CAPTCHA_SITE_KEY}
      theme={isDarkMode ? 'dark' : 'light'}
    />
  );
}
