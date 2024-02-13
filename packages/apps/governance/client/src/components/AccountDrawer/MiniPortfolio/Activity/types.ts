import { Currency } from '@uniswap/sdk-core'
import { TransactionStatus } from 'components/AccountDrawer/MiniPortfolio/constants'
import { SupportedChainId } from 'constants/chains'

export type Activity = {
  hash: string
  chainId: SupportedChainId
  status: TransactionStatus
  timestamp: number
  title: string
  descriptor?: string
  logos?: Array<string | undefined>
  currencies?: Array<Currency | undefined>
  otherAccount?: string
  receipt?: any
  nonce?: number | null
}
