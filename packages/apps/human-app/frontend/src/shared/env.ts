/* eslint-disable no-console -- .. */
import { ZodError, z } from 'zod';

const envSchema = z.object({
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
  VITE_NETWORK: z.enum(['mainnet', 'testnet']),
  VITE_TESTNET_AMOY_STAKING_CONTRACT: z.string(),
  VITE_TESTNET_AMOY_HMTOKEN_CONTRACT: z.string(),
  VITE_TESTNET_AMOY_ETH_KV_STORE_CONTRACT: z.string(),
  VITE_MAINNET_POLYGON_STAKING_CONTRACT: z.string(),
  VITE_MAINNET_POLYGON_HMTOKEN_CONTRACT: z.string(),
  VITE_MAINNET_POLYGON_ETH_KV_STORE_CONTRACT: z.string(),
});

let validEnvs;

function setError() {
  const root = document.getElementById('root');
  if (!root) return;

  const errorDiv = document.createElement('div');
  errorDiv.textContent = 'Invalid .env file. Open devtools to see more details';
  root.appendChild(errorDiv);
}

try {
  validEnvs = envSchema.parse(import.meta.env);
} catch (error) {
  if (error instanceof ZodError) {
    console.error('Invalid .env file');
    error.issues.forEach((issue) => {
      console.error('Invalid env:', issue.path.join());
      console.error(issue);
    });
    setError();
    throw new Error();
  }
  setError();
  console.error(error);
  throw new Error();
}

export const env = validEnvs;
