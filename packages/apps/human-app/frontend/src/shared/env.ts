import { z } from 'zod';

export const env = z
  .object({
    VITE_API_URL: z.string().default('/api'),
    VITE_PRIVACY_POLICY_URL: z.string(),
    VITE_TERMS_OF_SERVICE_URL: z.string(),
    VITE_HUMAN_PROTOCOL_URL: z.string(),
    VITE_H_CAPTCHA_SITE_KEY: z.string(),
    VITE_SYNAPS_KEY: z.string(),
    VITE_WALLET_CONNECT_PROJECT_ID: z.string(),
    VITE_DAPP_META_NAME: z.string(),
    VITE_DAPP_META_DESCRIPTION: z.string(),
    VITE_DAPP_META_URL: z.string(),
    VITE_DAPP_ICONS: z.string().transform((value) => {
      const iconsArray = value.split(',');
      return iconsArray;
    }),
  })
  .parse(import.meta.env);
