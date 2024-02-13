import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector } from '@web3-react/core'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { Actions, Connector } from '@web3-react/types'
import COINBASE_ICON from 'assets/images/coinbaseWalletIcon.svg'
import GNOSIS_ICON from 'assets/images/gnosis.png'
import WALLET_CONNECT_ICON from 'assets/images/walletConnectIcon.svg'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { isMobile } from 'utils/userAgent'

import { RPC_URLS } from '../constants/networks'
import { RPC_PROVIDERS } from '../constants/providers'
import { Connection, ConnectionType } from './types'
import { getInjection, getIsCoinbaseWallet, getIsInjected, getIsMetaMaskWallet } from './utils'
import { WalletConnectV2 } from './WalletConnectV2'

function onError(error: Error) {
  console.debug(`web3-react error: ${error}`)
}

const [web3Network, web3NetworkHooks] = initializeConnector<Network>(
  (actions) => new Network({ actions, urlMap: RPC_PROVIDERS, defaultChainId: HUB_CHAIN_ID })
)
export const networkConnection: Connection = {
  getName: () => 'Network',
  connector: web3Network,
  hooks: web3NetworkHooks,
  type: ConnectionType.NETWORK,
  shouldDisplay: () => false,
}

const getIsCoinbaseWalletBrowser = () => isMobile && getIsCoinbaseWallet()
const getIsMetaMaskBrowser = () => isMobile && getIsMetaMaskWallet()
const getIsInjectedMobileBrowser = () => getIsCoinbaseWalletBrowser() || getIsMetaMaskBrowser()

const getShouldAdvertiseMetaMask = () =>
  !getIsMetaMaskWallet() && !isMobile && (!getIsInjected() || getIsCoinbaseWallet())
const getIsGenericInjector = () => getIsInjected() && !getIsMetaMaskWallet() && !getIsCoinbaseWallet()

const [web3Injected, web3InjectedHooks] = initializeConnector<MetaMask>((actions) => new MetaMask({ actions, onError }))

const injectedConnection: Connection = {
  getName: () => getInjection().name,
  connector: web3Injected,
  hooks: web3InjectedHooks,
  type: ConnectionType.INJECTED,
  getIcon: (isDarkMode: boolean) => getInjection(isDarkMode).icon,
  shouldDisplay: () => getIsMetaMaskWallet() || getShouldAdvertiseMetaMask() || getIsGenericInjector(),
  // If on non-injected, non-mobile browser, prompt user to install Metamask
  overrideActivate: () => {
    if (getShouldAdvertiseMetaMask()) {
      window.open('https://metamask.io/', 'inst_metamask')
      return true
    }
    return false
  },
}

const [web3GnosisSafe, web3GnosisSafeHooks] = initializeConnector<GnosisSafe>((actions) => new GnosisSafe({ actions }))

export const gnosisSafeConnection: Connection = {
  getName: () => 'Gnosis Safe',
  connector: web3GnosisSafe,
  hooks: web3GnosisSafeHooks,
  type: ConnectionType.GNOSIS_SAFE,
  getIcon: () => GNOSIS_ICON,
  shouldDisplay: () => false,
}

export const walletConnectV2Connection: Connection = new (class implements Connection {
  private initializer = (actions: Actions, defaultChainId = HUB_CHAIN_ID) =>
    new WalletConnectV2({ actions, defaultChainId, onError })

  type = ConnectionType.WALLET_CONNECT_V2
  getName = () => 'WalletConnect'
  getIcon = () => WALLET_CONNECT_ICON
  shouldDisplay = () => false
  // BLOCKYTODO: if you want to see WalletConnect on the "Connect a wallet" list you need to change false to !getIsInjectedMobileBrowser()

  private _connector = initializeConnector<WalletConnectV2>(this.initializer)
  overrideActivate = (chainId?: SupportedChainId) => {
    // Always re-create the connector, so that the chainId is updated.
    this._connector = initializeConnector((actions) => this.initializer(actions, chainId))
    return false
  }
  get connector() {
    return this._connector[0]
  }
  get hooks() {
    return this._connector[1]
  }
})()

const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
  (actions) =>
    new CoinbaseWallet({
      actions,
      options: {
        url: RPC_URLS[HUB_CHAIN_ID][0],
        appName: 'Human Governance',
        reloadOnDisconnect: false,
      },
      onError,
    })
)

const coinbaseWalletConnection: Connection = {
  getName: () => 'Coinbase Wallet',
  connector: web3CoinbaseWallet,
  hooks: web3CoinbaseWalletHooks,
  type: ConnectionType.COINBASE_WALLET,
  getIcon: () => COINBASE_ICON,
  shouldDisplay: () =>
    Boolean((isMobile && !getIsInjectedMobileBrowser()) || !isMobile || getIsCoinbaseWalletBrowser()),
  // If on a mobile browser that isn't the coinbase wallet browser, deeplink to the coinbase wallet app
  overrideActivate: () => {
    if (isMobile && !getIsInjectedMobileBrowser()) {
      window.open('https://go.cb-w.com/mtUDhEZPy1', 'cbwallet')
      return true
    }
    return false
  },
}

export function getConnections() {
  return [
    injectedConnection,
    walletConnectV2Connection,
    coinbaseWalletConnection,
    gnosisSafeConnection,
    networkConnection,
  ]
}

export function getConnection(c: Connector | ConnectionType) {
  if (c instanceof Connector) {
    const connection = getConnections().find((connection) => connection.connector === c)
    if (!connection) {
      throw Error('unsupported connector')
    }
    return connection
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return injectedConnection
      case ConnectionType.COINBASE_WALLET:
        return coinbaseWalletConnection
      case ConnectionType.WALLET_CONNECT_V2:
        return walletConnectV2Connection
      case ConnectionType.NETWORK:
        return networkConnection
      case ConnectionType.GNOSIS_SAFE:
        return gnosisSafeConnection
    }
  }
}
