import { ChainId } from '@human-protocol/sdk';

export const HEADER_SIGNATURE_KEY = 'human-signature';
export const NS = 'hmt';
export const TOKEN = 'HMT';

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const TESTNET_CHAIN_IDS = [
  ChainId.POLYGON_AMOY,
  ChainId.BSC_TESTNET,
  ChainId.SEPOLIA,
];
export const MAINNET_CHAIN_IDS = [
  ChainId.POLYGON,
  ChainId.BSC_MAINNET,
  ChainId.MOONBEAM,
];

export const JWT_KVSTORE_KEY = 'jwt_public_key';
export const KYC_APPROVED = 'APPROVED';
