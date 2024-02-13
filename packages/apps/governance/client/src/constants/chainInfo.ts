import bnbCircleLogoUrl from 'assets/images/bnbCircle.svg'
import celoCircleLogoUrl from 'assets/images/celoCircle.png'
import ethereumLogoUrl from 'assets/images/ethereum-logo.png'
import polygonCircleLogoUrl from 'assets/images/polygonCircle.png'
import { default as arbitrumCircleLogoUrl, default as arbitrumLogoUrl } from 'assets/svg/arbitrum_logo.svg'
import avalanche_logo from 'assets/svg/avalanche_logo.svg'
import bnbSquareLogoUrl from 'assets/svg/bnb_square_logo.svg'
import bnbLogo from 'assets/svg/bnb-logo.svg'
import celoLogo from 'assets/svg/celo_logo.svg'
import celoSquareLogoUrl from 'assets/svg/celo_square_logo.svg'
import moonbeam_logo from 'assets/svg/moonbeam_logo.svg'
import optimismSquareLogoUrl from 'assets/svg/optimism_square_logo.svg'
import optimismLogoUrl from 'assets/svg/optimistic_ethereum.svg'
import polygonSquareLogoUrl from 'assets/svg/polygon_square_logo.svg'
import polygonMaticLogo from 'assets/svg/polygon-matic-logo.svg'
import skale_logo from 'assets/svg/skale_logo.svg'
import ms from 'ms.macro'
import { darkTheme } from 'theme/colors'

import { SupportedChainId, SupportedL1ChainId, SupportedL2ChainId } from './chains'
import { ARBITRUM_LIST, CELO_LIST, OPTIMISM_LIST, PLASMA_BNB_LIST } from './lists'

export const AVERAGE_L1_BLOCK_TIME = ms`12s`

export enum NetworkType {
  L1,
  L2,
}

interface BaseChainInfo {
  readonly networkType: NetworkType
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly explorer: string
  readonly logoUrl: string
  readonly circleLogoUrl?: string
  readonly squareLogoUrl?: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
  readonly color?: string
  readonly backgroundColor?: string
}

interface L1ChainInfo extends BaseChainInfo {
  readonly defaultListUrl?: string
}

interface L2ChainInfo extends BaseChainInfo {
  readonly statusPage?: string
  readonly defaultListUrl?: string
}

type ChainInfoMap = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in SupportedL2ChainId]: L2ChainInfo
} & { readonly [chainId in SupportedL1ChainId]: L1ChainInfo }

const CHAIN_INFO: ChainInfoMap = {
  [SupportedChainId.ETHEREUM]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    label: 'Ethereum',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_1,
  },
  [SupportedChainId.GOERLI]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    label: 'Görli',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    color: darkTheme.chain_5,
  },
  [SupportedChainId.OPTIMISM]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`25m`,
    defaultListUrl: OPTIMISM_LIST,
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    label: 'Optimism',
    logoUrl: optimismLogoUrl,
    // Optimism perfers same icon for both
    circleLogoUrl: optimismLogoUrl,
    squareLogoUrl: optimismSquareLogoUrl,
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_10,
    backgroundColor: darkTheme.chain_10_background,
  },
  [SupportedChainId.OPTIMISM_GOERLI]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`25m`,
    defaultListUrl: OPTIMISM_LIST,
    docs: 'https://optimism.io/',
    explorer: 'https://goerli-optimism.etherscan.io/',
    label: 'Optimism Görli',
    logoUrl: optimismLogoUrl,
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Optimism Goerli Ether', symbol: 'görOpETH', decimals: 18 },
    color: darkTheme.chain_420,
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    label: 'Arbitrum',
    logoUrl: arbitrumLogoUrl,
    circleLogoUrl: arbitrumCircleLogoUrl,
    defaultListUrl: ARBITRUM_LIST,
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_42,
    backgroundColor: darkTheme.chain_42161_background,
  },
  [SupportedChainId.ARBITRUM_GOERLI]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`10m`,
    defaultListUrl: ARBITRUM_LIST,
    docs: 'https://offchainlabs.com/',
    explorer: 'https://goerli.arbiscan.io/',
    label: 'Arbitrum Goerli',
    logoUrl: arbitrumLogoUrl,
    nativeCurrency: { name: 'Goerli Arbitrum Ether', symbol: 'AGOR', decimals: 18 },
  },
  [SupportedChainId.POLYGON]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    label: 'Polygon',
    logoUrl: polygonMaticLogo,
    circleLogoUrl: polygonCircleLogoUrl,
    squareLogoUrl: polygonSquareLogoUrl,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    color: darkTheme.chain_137,
    backgroundColor: darkTheme.chain_137_background,
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    label: 'Mumbai',
    logoUrl: polygonMaticLogo,
    nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'MATIC', decimals: 18 },
  },
  [SupportedChainId.CELO]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.celo.org/',
    explorer: 'https://celoscan.io/',
    label: 'Celo',
    logoUrl: celoLogo,
    circleLogoUrl: celoCircleLogoUrl,
    squareLogoUrl: celoSquareLogoUrl,
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [SupportedChainId.CELO_ALFAJORES]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.celo.org/',
    explorer: 'https://alfajores-blockscout.celo-testnet.org/',
    label: 'Celo Alfajores',
    logoUrl: celoLogo,
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [SupportedChainId.BNB]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.bnbchain.org/',
    explorer: 'https://bscscan.com/',
    label: 'BNB Mainnet',
    logoUrl: bnbLogo,
    circleLogoUrl: bnbCircleLogoUrl,
    squareLogoUrl: bnbSquareLogoUrl,
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    defaultListUrl: PLASMA_BNB_LIST,
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.BNB_TESTNET]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.bnbchain.org/',
    explorer: 'https://testnet.bscscan.com//',
    label: 'BNB Testnet',
    logoUrl: bnbLogo,
    circleLogoUrl: bnbCircleLogoUrl,
    squareLogoUrl: bnbSquareLogoUrl,
    nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
    defaultListUrl: PLASMA_BNB_LIST,
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.MOONBEAM]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.moonbeam.network/',
    explorer: 'https://blockscout.moonbeam.network',
    label: 'Moonbeam',
    logoUrl: moonbeam_logo,
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.MOONBASE]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.moonbeam.network/learn/platform/networks/moonbase/',
    explorer: 'https://moonbase-blockscout.testnet.moonbeam.network',
    label: 'Moonbase Alpha',
    logoUrl: moonbeam_logo,
    nativeCurrency: { name: 'Dev', symbol: 'DEV', decimals: 18 },
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.AVALANCHE]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.avax.network/',
    explorer: 'https://explorer.avax.network/',
    label: 'Avalanche',
    logoUrl: avalanche_logo,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.AVALANCHE_FUJI]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    docs: 'https://docs.avax.network/quickstart/fuji-workflow',
    explorer: 'https://cchain.explorer.avax-test.network/',
    label: 'Avalanche Fuji',
    logoUrl: avalanche_logo,
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [SupportedChainId.SKALE]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms`25m`,
    docs: 'https://docs.skale.network/',
    explorer: 'https://wan-red-ain.explorer.mainnet.skalenodes.com/',
    label: 'SKALE',
    logoUrl: skale_logo,
    nativeCurrency: { name: 'sFUEL', symbol: 'sFUEL', decimals: 18 },
    color: darkTheme.chain_56,
  },
  [SupportedChainId.SEPOLIA]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://sepolia.etherscan.io/',
    label: 'Sepolia',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
    color: darkTheme.chain_56,
  },
}

export function getChainInfo(chainId: SupportedL1ChainId): L1ChainInfo
export function getChainInfo(chainId: SupportedL2ChainId): L2ChainInfo
export function getChainInfo(chainId: SupportedChainId): L1ChainInfo | L2ChainInfo
export function getChainInfo(
  chainId: SupportedChainId | SupportedL1ChainId | SupportedL2ChainId | number | undefined
): L1ChainInfo | L2ChainInfo | undefined

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * SupportedChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(chainId: any): any {
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}
