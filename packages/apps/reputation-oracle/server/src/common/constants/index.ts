export const SERVICE_NAME = 'reputation-oracle';
export const DATABASE_SCHEMA_NAME = 'hmt';
export const JWT_STRATEGY_NAME = 'jwt-http';

export const CVAT_RESULTS_ANNOTATIONS_FILENAME = 'resulting_annotations.zip';
export const CVAT_VALIDATION_META_FILENAME = 'validation_meta.json';

export const HEADER_SIGNATURE_KEY = 'human-signature';

export const RESEND_EMAIL_VERIFICATION_PATH =
  '/auth/web2/resend-verification-email';
export const LOGOUT_PATH = '/auth/logout';

export const BACKOFF_INTERVAL_SECONDS = 120;

export enum SupportedExchange {
  MEXC = 'mexc',
  GATE = 'gate',
}

export type SupportedExchangeInfo = {
  name: SupportedExchange;
  displayName: string;
};

export const SUPPORTED_EXCHANGES_INFO: readonly SupportedExchangeInfo[] = [
  { name: SupportedExchange.MEXC, displayName: 'MEXC' },
  { name: SupportedExchange.GATE, displayName: 'Gate' },
] as const;

export const DEFAULT_TIMEOUT_MS = 5000;
export const SDK_TX_TIMEOUT_MS = 90000;
