import { ChainId } from '@human-protocol/sdk';
import { TOKEN_ADDRESSES } from '../constants/tokens';
import { EscrowFundToken } from '../enums/job';

/**
 * Returns decimals for a token, clamped to defaultDecimals (internal default = 6).
 * Pass a higher defaultDecimals (e.g. 18) when full on-chain precision is required.
 */
export function getTokenDecimals(
  chainId: ChainId,
  symbol: EscrowFundToken,
  defaultDecimals = 6,
): number {
  return Math.min(
    TOKEN_ADDRESSES[chainId]?.[symbol]?.decimals ?? defaultDecimals,
    defaultDecimals,
  );
}
