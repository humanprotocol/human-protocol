import { Contract } from '@ethersproject/contracts'
import type { JsonRpcProvider } from '@ethersproject/providers'
import UniswapInterfaceMulticallJson from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { useWeb3React } from '@web3-react/core'
import ENS_PUBLIC_RESOLVER_ABI from 'abis/ens-public-resolver.json'
import ENS_ABI from 'abis/ens-registrar.json'
import ERC20_ABI from 'abis/erc20.json'
import ERC20_BYTES32_ABI from 'abis/erc20_bytes32.json'
import ERC721_ABI from 'abis/erc721.json'
import ERC1155_ABI from 'abis/erc1155.json'
import { ENS_REGISTRAR_ADDRESSES, MULTICALL_ADDRESS } from 'constants/addresses'
import { HUB_CHAIN_ID } from 'constants/addresses'
import { useMemo } from 'react'

import { getContract } from '../utils'

const { abi: MulticallABI } = UniswapInterfaceMulticallJson

// returns null on errors
export function useContract<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  withSignerIfPossible = true
): T | null {
  const { provider, account, chainId } = useWeb3React()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: string | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return getContract(address, ABI, provider, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [addressOrAddressMap, ABI, provider, chainId, withSignerIfPossible, account]) as T
}

export function useContractWithCustomProvider<T extends Contract = Contract>(
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: any,
  provider: JsonRpcProvider | undefined
): T | null {
  const chainId = HUB_CHAIN_ID
  const { account } = useWeb3React()

  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null
    let address: string | undefined
    if (typeof addressOrAddressMap === 'string') address = addressOrAddressMap
    else address = addressOrAddressMap[chainId]
    if (!address) return null
    try {
      return getContract(address, ABI, provider, account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [addressOrAddressMap, ABI, chainId, account, provider]) as T
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean) {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useERC721Contract(nftAddress?: string) {
  return useContract(nftAddress, ERC721_ABI, false)
}

export function useERC1155Contract(nftAddress?: string) {
  return useContract(nftAddress, ERC1155_ABI, false)
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean) {
  return useContract(ENS_REGISTRAR_ADDRESSES, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean) {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function useInterfaceMulticall() {
  return useContract(MULTICALL_ADDRESS, MulticallABI, false)
}
