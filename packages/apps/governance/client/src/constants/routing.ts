// a list of tokens by chain
import { Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'

import {
  AMPL,
  BTC_BSC,
  BUSD_BSC,
  CAKE_BSC,
  CEUR_CELO,
  CMC02_CELO,
  CUSD_CELO,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_BSC,
  DAI_OPTIMISM,
  DAI_POLYGON,
  ETH_BSC,
  ETH2X_FLI,
  FEI,
  FRAX,
  FRAX_BSC,
  FXS,
  MATIC_BSC,
  PORTAL_ETH_CELO,
  PORTAL_USDC_CELO,
  renBTC,
  rETH2,
  sETH2,
  SWISE,
  TRIBE,
  USDC_BSC,
  USDC_MAINNET,
  USDC_POLYGON,
  USDT,
  USDT_ARBITRUM_ONE,
  USDT_BSC,
  USDT_OPTIMISM,
  USDT_POLYGON,
  WBTC,
  WBTC_ARBITRUM_ONE,
  WBTC_OPTIMISM,
  WETH_POLYGON,
  WRAPPED_NATIVE_CURRENCY,
} from './tokens'

type ChainTokenList = {
  readonly [chainId: number]: Token[]
}

const WRAPPED_NATIVE_CURRENCIES_ONLY: ChainTokenList = Object.fromEntries(
  Object.entries(WRAPPED_NATIVE_CURRENCY)
    .map(([key, value]) => [key, [value]])
    .filter(Boolean)
)

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.ETHEREUM]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ETHEREUM],
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
  ],
  [SupportedChainId.OPTIMISM]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.OPTIMISM],
    DAI_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [SupportedChainId.ARBITRUM_ONE]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ARBITRUM_ONE],
    DAI_ARBITRUM_ONE,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
  ],
  [SupportedChainId.POLYGON]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.POLYGON],
    DAI_POLYGON,
    USDC_POLYGON,
    USDT_POLYGON,
    WETH_POLYGON,
  ],
  [SupportedChainId.BNB]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.BNB],
    DAI_BSC,
    USDC_BSC,
    USDT_BSC,
    BUSD_BSC,
    FRAX_BSC,
    MATIC_BSC,
    CAKE_BSC,
  ],
  [SupportedChainId.CELO]: [CUSD_CELO, CEUR_CELO, CMC02_CELO, PORTAL_USDC_CELO, PORTAL_ETH_CELO],
}
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.ETHEREUM]: {
    '0xF16E4d813f4DcfDe4c5b44f305c908742De84eF0': [ETH2X_FLI],
    [rETH2.address]: [sETH2],
    [SWISE.address]: [sETH2],
    [FEI.address]: [TRIBE],
    [TRIBE.address]: [FEI],
    [FRAX.address]: [FXS],
    [FXS.address]: [FRAX],
    [WBTC.address]: [renBTC],
    [renBTC.address]: [WBTC],
  },
}
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.ETHEREUM]: {
    [AMPL.address]: [DAI, WRAPPED_NATIVE_CURRENCY[SupportedChainId.ETHEREUM] as Token],
  },
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WRAPPED_NATIVE_CURRENCIES_ONLY,
  [SupportedChainId.ETHEREUM]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ETHEREUM],
    DAI,
    USDC_MAINNET,
    USDT,
    WBTC,
  ],
  [SupportedChainId.BNB]: [
    ...WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.BNB],
    DAI_BSC,
    USDC_BSC,
    USDT_BSC,
    BTC_BSC,
    BUSD_BSC,
    ETH_BSC,
  ],
}
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [SupportedChainId.ETHEREUM]: [
    [
      new Token(SupportedChainId.ETHEREUM, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
      new Token(
        SupportedChainId.ETHEREUM,
        '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
        8,
        'cUSDC',
        'Compound USD Coin'
      ),
    ],
    [USDC_MAINNET, USDT],
    [DAI, USDT],
  ],
}
