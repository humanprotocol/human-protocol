import { useWeb3React } from '@web3-react/core'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const hubProvider = RPC_PROVIDERS[HUB_CHAIN_ID as SupportedChainId]

const MISSING_PROVIDER = Symbol()
const BlockNumberContext = createContext<
  | {
      value?: number
      hubBlock?: number
      fastForward(block: number): void
    }
  | typeof MISSING_PROVIDER
>(MISSING_PROVIDER)

function useBlockNumberContext() {
  const blockNumber = useContext(BlockNumberContext)

  if (blockNumber === MISSING_PROVIDER) {
    throw new Error('BlockNumber hooks must be wrapped in a <BlockNumberProvider>')
  }
  return blockNumber
}

/** Requires that BlockUpdater be installed in the DOM tree. */
export default function useBlockNumber(): number | undefined {
  return useBlockNumberContext().value
}

export function useFastForwardBlockNumber(): (block: number) => void {
  return useBlockNumberContext().fastForward
}

export function useHubBlockNumber(): number | undefined {
  return useBlockNumberContext().hubBlock
}

export function BlockNumberProvider({ children }: { children: ReactNode }) {
  const { chainId: activeChainId, provider } = useWeb3React()

  const [{ chainId, block }, setChainBlock] = useState<{ chainId?: number; block?: number }>({ chainId: activeChainId })
  const [hubBlock, setHubBlock] = useState<number | undefined>(undefined)

  const onBlock = useCallback(
    (block: number) => {
      setChainBlock((chainBlock) => {
        if (chainBlock.chainId === activeChainId) {
          if (!chainBlock.block || chainBlock.block < block) {
            return { chainId: activeChainId, block }
          }
        }
        return chainBlock
      })
    },
    [activeChainId, setChainBlock]
  )

  const windowVisible = useIsWindowVisible()

  useEffect(() => {
    let stale = false

    hubProvider
      .getBlockNumber()
      .then((block) => {
        if (!stale) setHubBlock(block)
      })
      .catch((error) => {
        console.error(`Failed to get block number for hub chain`, error)
      })

    hubProvider.on('block', (block: number) => {
      if (!stale) setHubBlock(block)
    })

    return () => {
      stale = true
      hubProvider.removeListener('block', setHubBlock)
    }
  }, [])

  useEffect(() => {
    let stale = false

    if (provider && activeChainId && windowVisible) {
      // If chainId hasn't changed, don't clear the block. This prevents re-fetching still valid data.
      setChainBlock((chainBlock) => (chainBlock.chainId === activeChainId ? chainBlock : { chainId: activeChainId }))

      provider
        .getBlockNumber()
        .then((block) => {
          if (!stale) onBlock(block)
        })
        .catch((error) => {
          console.error(`Failed to get block number for chainId ${activeChainId}`, error)
        })

      provider.on('block', onBlock)
      return () => {
        stale = true
        provider.removeListener('block', onBlock)
      }
    }

    return void 0
  }, [activeChainId, provider, onBlock, setChainBlock, windowVisible])

  const value = useMemo(
    () => ({
      value: chainId === activeChainId ? block : undefined,
      hubBlock,
      fastForward: (update: number) => {
        if (block && update > block) {
          setChainBlock({ chainId: activeChainId, block: update })
        }
      },
    }),
    [activeChainId, block, chainId, hubBlock]
  )

  return <BlockNumberContext.Provider value={value}>{children}</BlockNumberContext.Provider>
}
