/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NFT_STORAGE_API: string;
  readonly VITE_APP_FAUCET_SERVER_URL: string;
  readonly VITE_APP_WALLETCONNECT_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum: any;
}
