import { forwardRef, useImperativeHandle, useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { env } from '@/shared/env';

export interface CustomHCaptchaRef {
  reset: () => void;
}

interface CustomHCaptchaProps {
  onVerify: (token: string) => void;
}

function InternalHCaptcha(
  { onVerify }: CustomHCaptchaProps,
  ref: React.Ref<unknown>
) {
  const captchaRef = useRef<HCaptcha>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
      }
    },
  }));

  return (
    <HCaptcha
      onVerify={(token: string) => {
        onVerify(token);
      }}
      ref={captchaRef}
      sitekey={env.VITE_H_CAPTCHA_SITE_KEY}
      theme="contrast"
    />
  );
}

export const CustomHCaptcha = forwardRef<
  CustomHCaptchaRef,
  CustomHCaptchaProps
>(InternalHCaptcha);
