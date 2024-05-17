/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_JOB_LAUNCHER_SERVER_URL: string;
  readonly VITE_APP_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_APP_STRIPE_PUBLISHABLE_KEY: string;
  readonly VITE_APP_HCAPTCHA_SITE_KEY: string;
  readonly VITE_APP_HCAPTCHA_EXCHANGE_URL: string;
  readonly VITE_APP_HCAPTCHA_LABELING_BASE_URL: string;
  readonly VITE_APP_ENVIRONMENT: string;

  readonly VITE_APP_RPC_URL_MAINNET: string;
  readonly VITE_APP_RPC_URL_SEPOLIA: string;
  readonly VITE_APP_RPC_URL_BSC_MAINNET: string;
  readonly VITE_APP_RPC_URL_BSC_TESTNET: string;
  readonly VITE_APP_RPC_URL_POLYGON: string;
  readonly VITE_APP_RPC_URL_POLYGON_AMOY: string;
  readonly VITE_APP_RPC_URL_MOONBEAM: string;
  readonly VITE_APP_RPC_URL_MOONBASE_ALPHA: string;
  readonly VITE_APP_RPC_URL_AVALANCHE: string;
  readonly VITE_APP_RPC_URL_AVALANCHE_TESTNET: string;
  readonly VITE_APP_RPC_URL_CELO: string;
  readonly VITE_APP_RPC_URL_CELO_ALFAJORES: string;
  readonly VITE_APP_RPC_URL_SKALE: string;
  readonly VITE_APP_RPC_URL_XLAYER: string;
  readonly VITE_APP_RPC_URL_XLAYER_TESTNET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum: any;
}
