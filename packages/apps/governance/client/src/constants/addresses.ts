import { getEnvAddresses } from 'utils/getEnvAddresses'

import { SupportedChainId } from './chains'

export type AddressMap = { [chainId: number]: string }

const DEFAULT_NETWORKS = [SupportedChainId.ETHEREUM, SupportedChainId.GOERLI]

function constructSameAddressMap(address: string, additionalNetworks: SupportedChainId[] = []): AddressMap {
  return DEFAULT_NETWORKS.concat(additionalNetworks).reduce<AddressMap>((memo, chainId) => {
    memo[chainId] = address
    return memo
  }, {})
}

const HUB_CHAIN_ADDRESS = process.env.REACT_APP_GOVERNANCE_HUB_ADDRESS as string
const HUB_TOKEN_ADDRESS = process.env.REACT_APP_HUB_VOTE_TOKEN as string

export const HUB_CHAIN_ID = parseInt(process.env.REACT_APP_HUB_CHAIN_ID as string, 10)

export const GOVERNANCE_HUB_ADDRESS: AddressMap = {
  [HUB_CHAIN_ID]: HUB_CHAIN_ADDRESS as string,
}

export const HUB_VOTE_TOKEN_ADDRESS: AddressMap = {
  [HUB_CHAIN_ID]: HUB_TOKEN_ADDRESS as string,
}

export const GOVERNANCE_SPOKE_ADRESSES: AddressMap = getEnvAddresses('REACT_APP_GOVERNANCE_SPOKE_CHAIN_')
export const SPOKE_VOTE_TOKEN_ADDRESSES: AddressMap = getEnvAddresses('REACT_APP_GOVERNANCE_SPOKE_VOTE_TOKEN_')

// celo v3 addresses
const CELO_MULTICALL_ADDRESS = '0x633987602DE5C4F337e3DbF265303A1080324204'

// BNB v3 addresses
const BNB_MULTICALL_ADDRESS = '0x963Df249eD09c358A4819E39d9Cd5736c3087184'

// optimism goerli addresses
const OPTIMISM_GOERLI_MULTICALL_ADDRESS = '0x07F2D8a2a02251B62af965f22fC4744A5f96BCCd'

// arbitrum goerli v3 addresses
const ARBITRUM_GOERLI_MULTICALL_ADDRESS = '0x8260CB40247290317a4c062F3542622367F206Ee'

export const MULTICALL_ADDRESS: AddressMap = {
  ...constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
  ]),
  [SupportedChainId.ARBITRUM_ONE]: '0xadF885960B47eA2CD9B55E6DAc6B42b7Cb2806dB',
  [SupportedChainId.CELO]: CELO_MULTICALL_ADDRESS,
  [SupportedChainId.CELO_ALFAJORES]: CELO_MULTICALL_ADDRESS,
  [SupportedChainId.BNB]: BNB_MULTICALL_ADDRESS,
  [SupportedChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI_MULTICALL_ADDRESS,
  [SupportedChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI_MULTICALL_ADDRESS,
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [SupportedChainId.ETHEREUM]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.GOERLI]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}
