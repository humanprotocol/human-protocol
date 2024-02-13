import { TradeType } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

export enum RouterPreference {
  AUTO = 'auto',
  API = 'api',
  CLIENT = 'client',
}

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

const routers = new Map<SupportedChainId, any>()

export interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: SupportedChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: SupportedChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  tradeType: TradeType
}
