import { z } from 'zod';

export const env = z
  .object({
    VITE_API_URL: z.string().default('/api'),
    VITE_PRIVACY_POLICY_URL: z.string(),
    VITE_TERMS_OF_SERVICE_URL: z.string(),
    VITE_HUMAN_PROTOCOL_URL: z.string(),
    VITE_H_CAPTCHA_SITE_KEY: z.string(),
    VITE_SYNAPS_KEY: z.string(),
  })
  .parse(import.meta.env);
