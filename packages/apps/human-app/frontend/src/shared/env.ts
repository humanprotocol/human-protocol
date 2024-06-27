import { z } from 'zod';

export const env = z
  .object({
    VITE_API_URL: z.string().default('/api'),
    VITE_PRIVACY_POLICY_URL: z.string(),
    VITE_TERMS_OF_SERVICE_URL: z.string(),
    VITE_HUMAN_PROTOCOL_URL: z.string(),
    VITE_NAVBAR__LINK__PROTOCOL_URL: z.string(),
    VITE_NAVBAR__LINK__HOW_IT_WORK_URL: z.string(),
    VITE_HUMAN_PROTOCOL_HELP_URL: z.string(),
    VITE_H_CAPTCHA_SITE_KEY: z.string(),
    VITE_HMT_DAILY_SPENT_LIMIT: z
      .string()
      .transform((value) => Number(value))
      .pipe(z.number()),
    VITE_DAILY_SOLVED_CAPTCHA_LIMIT: z
      .string()
      .transform((value) => Number(value))
      .pipe(z.number()),
    VITE_H_CAPTCHA_EXCHANGE_URL: z.string(),
    VITE_H_CAPTCHA_LABELING_BASE_URL: z.string(),
    VITE_WALLET_CONNECT_PROJECT_ID: z.string(),
    VITE_DAPP_META_NAME: z.string(),
    VITE_DAPP_META_DESCRIPTION: z.string(),
    VITE_DAPP_META_URL: z.string(),
    VITE_DAPP_ICONS: z.string().transform((value) => {
      const iconsArray = value.split(',');
      return iconsArray;
    }),
    VITE_TESTNET_AMOY_STAKING_CONTRACT: z.string(),
    VITE_TESTNET_AMOY_HMTOKEN_CONTRACT: z.string(),
    VITE_TESTNET_AMOY_ETH_KV_STORE_CONTRACT: z.string(),
    VITE_MAINNET_POLYGON_STAKING_CONTRACT: z.string(),
    VITE_MAINNET_POLYGON_HMTOKEN_CONTRACT: z.string(),
    VITE_MAINNET_POLYGON_ETH_KV_STORE_CONTRACT: z.string(),
  })
  .parse(import.meta.env);
