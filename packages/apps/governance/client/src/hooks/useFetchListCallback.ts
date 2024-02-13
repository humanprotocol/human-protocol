import { nanoid } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import getTokenList from 'lib/hooks/useTokenList/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'

import { fetchTokenList } from '../state/lists/actions'

export function useFetchListCallback(): (listUrl: string) => Promise<TokenList> {
  const dispatch = useAppDispatch()

  return useCallback(
    async (listUrl: string) => {
      const requestId = nanoid()
      dispatch(fetchTokenList.pending({ requestId, url: listUrl }))
      return getTokenList(listUrl, (ensName: string) =>
        resolveENSContentHash(ensName, RPC_PROVIDERS[SupportedChainId.ETHEREUM])
      )
        .then((tokenList) => {
          dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList, requestId }))
          return tokenList
        })
        .catch((error) => {
          console.debug(`Failed to get list at url ${listUrl}`, error)
          dispatch(fetchTokenList.rejected({ url: listUrl, requestId, errorMessage: error.message }))
          throw error
        })
    },
    [dispatch]
  )
}
