import type { Filter } from '@ethersproject/providers'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { useEffect, useMemo } from 'react'

import { useAppDispatch, useAppSelector } from '../hooks'
import { fetchedLogs, fetchedLogsError, fetchingLogs } from './slice'
import { isHistoricalLog, keyToFilter } from './utils'

const chainId = HUB_CHAIN_ID
const hubProvider = RPC_PROVIDERS[HUB_CHAIN_ID as SupportedChainId]

export default function Updater(): null {
  const dispatch = useAppDispatch()
  const state = useAppSelector((state) => state.logs)

  const blockNumber = useBlockNumber()

  const filtersNeedFetch: Filter[] = useMemo(() => {
    if (!chainId || typeof blockNumber !== 'number') return []

    const active = state[chainId]
    if (!active) return []

    return Object.keys(active)
      .filter((key) => {
        const { fetchingBlockNumber, results, listeners } = active[key]
        if (listeners === 0) return false
        if (typeof fetchingBlockNumber === 'number' && fetchingBlockNumber >= blockNumber) return false
        if (results && typeof results.blockNumber === 'number' && results.blockNumber >= blockNumber) return false
        // this condition ensures that if a log is historical, and it's already fetched, we don't re-fetch it
        if (isHistoricalLog(keyToFilter(key), blockNumber) && results?.logs !== undefined) return false
        return true
      })
      .map((key) => keyToFilter(key))
  }, [blockNumber, state])

  useEffect(() => {
    if (!hubProvider || !chainId || typeof blockNumber !== 'number' || filtersNeedFetch.length === 0) return

    dispatch(fetchingLogs({ chainId, filters: filtersNeedFetch, blockNumber }))
    filtersNeedFetch.forEach((filter) => {
      // provide defaults if {from,to}Block are missing
      let fromBlock = filter.fromBlock ?? 0
      let toBlock = filter.toBlock ?? blockNumber

      if (typeof fromBlock === 'string') fromBlock = Number.parseInt(fromBlock)
      if (typeof toBlock === 'string') toBlock = Number.parseInt(toBlock)

      hubProvider
        .getLogs({
          ...filter,
          fromBlock,
          toBlock,
        })
        .then((logs) => {
          dispatch(
            fetchedLogs({
              chainId,
              filter,
              results: { logs, blockNumber },
            })
          )
        })
        .catch((error) => {
          console.error('Failed to get logs', filter, error)
          dispatch(
            fetchedLogsError({
              chainId,
              filter,
              blockNumber,
            })
          )
        })
    })
  }, [blockNumber, dispatch, filtersNeedFetch])

  return null
}
