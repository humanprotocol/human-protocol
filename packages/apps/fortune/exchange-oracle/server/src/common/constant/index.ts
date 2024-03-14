import { ChainId } from '@human-protocol/sdk';

export const HEADER_SIGNATURE_KEY = 'human-signature';
export const ESCROW_FAILED_ENDPOINT = '/job/escrow-failed-webhook';
export const NS = 'hmt';

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];

export const TESTNET_CHAIN_IDS = [
  ChainId.POLYGON_MUMBAI,
  ChainId.BSC_TESTNET,
  ChainId.GOERLI,
];
export const MAINNET_CHAIN_IDS = [
  ChainId.POLYGON,
  ChainId.BSC_MAINNET,
  ChainId.MOONBEAM,
];
