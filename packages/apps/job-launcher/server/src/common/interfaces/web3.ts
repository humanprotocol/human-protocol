import { EscrowFundToken } from '../enums/job';

export interface IERC20Token {
  address: string;
  decimals: number;
  symbol: EscrowFundToken;
}
