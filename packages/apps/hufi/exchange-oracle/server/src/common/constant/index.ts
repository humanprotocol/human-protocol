import { ChainId } from "@human-protocol/sdk";

export const HEADER_SIGNATURE_KEY = 'human-signature';
export const ESCROW_FAILED_ENDPOINT = '/job/escrow-failed-webhook';

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
