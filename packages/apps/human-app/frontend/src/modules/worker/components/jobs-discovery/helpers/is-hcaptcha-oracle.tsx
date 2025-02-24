import { env } from '@/shared/env';

export const isHCaptchaOracle = (address: string): boolean =>
  address === env.VITE_H_CAPTCHA_ORACLE_ADDRESS;
