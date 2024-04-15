import { useRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface CaptchaProps {
  setCaptchaToken: (token: string) => void;
}

export function Captcha({ setCaptchaToken }: CaptchaProps) {
  const captchaRef = useRef<HCaptcha>(null);

  const onLoad = () => {
    // this reaches out to the hCaptcha JS API and runs the
    // execute function on it. you can use other functions as
    // documented here:
    // https://docs.hcaptcha.com/configuration#jsapi
    if (captchaRef.current) {
      captchaRef.current.execute();
    }
  };

  return (
    <HCaptcha
      onLoad={onLoad}
      onVerify={setCaptchaToken}
      ref={captchaRef}
      // TODO add correct sitekey
      sitekey="10000000-ffff-ffff-ffff-000000000001"
    />
  );
}
