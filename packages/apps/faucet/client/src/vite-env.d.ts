/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_FAUCET_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
