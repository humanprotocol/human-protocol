/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_JOB_LAUNCHER_SERVER_URL: string;
  readonly VITE_APP_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_APP_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_HCAPTCHA_SITE_KEY: string;
  readonly VITE_APP_HCAPTCHA_EXCHANGE_URL: string;
  readonly VITE_APP_HCAPTCHA_LABELING_BASE_URL: string;
  readonly VITE_APP_ENVIRONMENT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum: any;
}
