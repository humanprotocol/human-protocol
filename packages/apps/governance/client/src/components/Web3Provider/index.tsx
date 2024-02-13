import { useWeb3React, Web3ReactHooks, Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnection } from 'connection'
import { isSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { TraceJsonRpcVariant, useTraceJsonRpcFlag } from 'featureFlags/flags/traceJsonRpc'
import useEagerlyConnect from 'hooks/useEagerlyConnect'
import useOrderedConnections from 'hooks/useOrderedConnections'
import usePrevious from 'hooks/usePrevious'
import { ReactNode, useEffect } from 'react'
import { useConnectedWallets } from 'state/wallets/hooks'

export default function Web3Provider({ children }: { children: ReactNode }) {
  useEagerlyConnect()
  const connections = useOrderedConnections()
  const connectors: [Connector, Web3ReactHooks][] = connections.map(({ hooks, connector }) => [connector, hooks])

  return (
    <Web3ReactProvider connectors={connectors}>
      <Updater />
      {children}
    </Web3ReactProvider>
  )
}

/** A component to run hooks under the Web3ReactProvider context. */
function Updater() {
  const { account, chainId, connector, provider } = useWeb3React()

  // Trace RPC calls (for debugging).
  const networkProvider = isSupportedChain(chainId) ? RPC_PROVIDERS[chainId] : undefined
  const shouldTrace = useTraceJsonRpcFlag() === TraceJsonRpcVariant.Enabled
  useEffect(() => {
    if (shouldTrace) {
      provider?.on('debug', trace)
      if (provider !== networkProvider) {
        networkProvider?.on('debug', trace)
      }
    }
    return () => {
      provider?.off('debug', trace)
      networkProvider?.off('debug', trace)
    }
  }, [networkProvider, provider, shouldTrace])

  // Send analytics events when the active account changes.
  const previousAccount = usePrevious(account)
  const [connectedWallets, addConnectedWallet] = useConnectedWallets()
  useEffect(() => {
    if (account && account !== previousAccount) {
      const walletType = getConnection(connector).getName()

      addConnectedWallet({ account, walletType })
    }
  }, [account, addConnectedWallet, chainId, connectedWallets, connector, previousAccount, provider])

  return null
}

function trace(event: any) {
  if (!event?.request) return
  const { method, id, params } = event.request
  console.groupCollapsed(method, id)
  console.debug(params)
  console.groupEnd()
}
