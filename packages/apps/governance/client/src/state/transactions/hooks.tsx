import type { TransactionResponse } from '@ethersproject/providers'
import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { addTransaction, removeTransaction } from './reducer'
import { TransactionDetails, TransactionInfo } from './types'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (response: TransactionResponse, info: TransactionInfo) => void {
  const { chainId, account } = useWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (response: TransactionResponse, info: TransactionInfo) => {
      if (!account) return
      if (!chainId) return

      const { hash, nonce } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, info, chainId, nonce }))
    },
    [account, chainId, dispatch]
  )
}

export function useTransactionRemover() {
  const { chainId, account } = useWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (hash: string) => {
      if (!account) return
      if (!chainId) return

      dispatch(removeTransaction({ hash, chainId }))
    },
    [account, chainId, dispatch]
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useWeb3React()

  const state = useAppSelector((state) => state.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

export function useTransaction(transactionHash?: string): TransactionDetails | undefined {
  const allTransactions = useAllTransactions()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return Boolean(transactions[transactionHash].receipt)
}

// export function useMultichainTransactions(): [TransactionDetails, SupportedChainId][] {
//   const state = useAppSelector((state) => state.transactions)
//   return ALL_SUPPORTED_CHAIN_IDS.flatMap((chainId) =>
//     state[chainId]
//       ? Object.values(state[chainId]).map((tx): [TransactionDetails, SupportedChainId] => [tx, chainId])
//       : []
//   )
// }
