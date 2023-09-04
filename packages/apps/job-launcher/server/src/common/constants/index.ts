import { ChainId } from '@human-protocol/sdk';

export const NS = 'hmt';
export const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price';
export const JOB_RETRIES_COUNT_THRESHOLD = 3;
export const TX_CONFIRMATION_TRESHOLD = 1;

export const JWT_PREFIX = 'bearer ';
export const TESTNET_CHAIN_IDS = [
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.GOERLI,
];
export const MAINNET_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.POLYGON,
  ChainId.MOONBEAM,
];

export const SENDGRID_API_KEY_REGEX =
  /^SG\.[A-Za-z0-9-_]{22}\.[A-Za-z0-9-_]{43}$/;

export const HEADER_SIGNATURE_KEY = 'human-signature';
