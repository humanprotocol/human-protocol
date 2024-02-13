/**
 * SupportedChainId must be defined inline, without using @uniswap/sdk-core, so that its members are their own types
 * {@see https://www.typescriptlang.org/docs/handbook/enums.html#union-enums-and-enum-member-types}. This allows the
 * derived const arrays and their types (eg {@link L1_CHAIN_IDS}, {@link SupportedL1ChainId}) to be narrowed and used
 * to enforce chain typing.
 *
 * Because this is not explicitly derived from @uniswap/sdk-core, there is a unit test to enforce conformance.
 */
export enum SupportedChainId {
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  ETHEREUM = 1,
  GOERLI = 5,
  BNB = 56,
  BNB_TESTNET = 97,
  MOONBEAM = 1284,
  MOONBASE = 1287,
  AVALANCHE = 43114,
  AVALANCHE_FUJI = 43113,
  SKALE = 1273227453,

  SEPOLIA = 11155111,
  ARBITRUM_ONE = 42161,
  ARBITRUM_GOERLI = 421613,
  OPTIMISM = 10,
  OPTIMISM_GOERLI = 420,
  CELO = 42220,
  CELO_ALFAJORES = 44787,
}

export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.ETHEREUM]: 'ethereum',
  [SupportedChainId.GOERLI]: 'goerli',
  [SupportedChainId.POLYGON]: 'polygon',
  [SupportedChainId.POLYGON_MUMBAI]: 'polygon_mumbai',
  [SupportedChainId.CELO]: 'celo',
  [SupportedChainId.CELO_ALFAJORES]: 'celo_alfajores',
  [SupportedChainId.ARBITRUM_ONE]: 'arbitrum',
  [SupportedChainId.ARBITRUM_GOERLI]: 'arbitrum_goerli',
  [SupportedChainId.OPTIMISM]: 'optimism',
  [SupportedChainId.OPTIMISM_GOERLI]: 'optimism_goerli',
  [SupportedChainId.BNB]: 'bnb',
  [SupportedChainId.BNB_TESTNET]: 'bnb_testnet',
  [SupportedChainId.MOONBEAM]: 'moonbeam',
  [SupportedChainId.MOONBASE]: 'moonbase',
  [SupportedChainId.AVALANCHE]: 'avalanche',
  [SupportedChainId.AVALANCHE_FUJI]: 'avalanche_fuji',
  [SupportedChainId.SKALE]: 'skale',
  [SupportedChainId.SEPOLIA]: 'sepolia',
}

export function isSupportedChain(chainId: number | null | undefined): chainId is SupportedChainId {
  return !!chainId && !!SupportedChainId[chainId]
}

export const L1_CHAIN_IDS = [
  SupportedChainId.ETHEREUM,
  SupportedChainId.GOERLI,
  SupportedChainId.POLYGON,
  SupportedChainId.POLYGON_MUMBAI,
  SupportedChainId.CELO,
  SupportedChainId.CELO_ALFAJORES,
  SupportedChainId.BNB,
  SupportedChainId.BNB_TESTNET,
  SupportedChainId.MOONBEAM,
  SupportedChainId.MOONBASE,
  SupportedChainId.AVALANCHE,
  SupportedChainId.AVALANCHE_FUJI,
  SupportedChainId.SEPOLIA,
] as const

export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.OPTIMISM,
  SupportedChainId.OPTIMISM_GOERLI,
  SupportedChainId.ARBITRUM_GOERLI,
  SupportedChainId.SKALE,
] as const

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number]

export function isPolygonChain(chainId: number): chainId is SupportedChainId.POLYGON | SupportedChainId.POLYGON_MUMBAI {
  return chainId === SupportedChainId.POLYGON || chainId === SupportedChainId.POLYGON_MUMBAI
}
