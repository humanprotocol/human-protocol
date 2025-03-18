import { ChainId } from '@human-protocol/sdk';
import { TOKEN_ADDRESSES } from '../constants/tokens';
import { EscrowFundToken } from '../enums/job';

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
