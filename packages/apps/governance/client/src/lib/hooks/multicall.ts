import { useWeb3React } from '@web3-react/core'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import multicall from 'lib/state/multicall'
import { SkipFirst } from 'types/tuple'

export { NEVER_RELOAD } from '@uniswap/redux-multicall' // re-export for convenience

// Create wrappers for hooks so consumers don't need to get latest block themselves

type SkipFirstTwoParams<T extends (...args: any) => any> = SkipFirst<Parameters<T>, 2>

export function useSingleCallResult(...args: SkipFirstTwoParams<typeof multicall.hooks.useSingleCallResult>) {
  const { chainId, latestBlock } = useCallContext()
  return multicall.hooks.useSingleCallResult(chainId, latestBlock, ...args)
}

function useCallContext() {
  const { chainId } = useWeb3React()
  const latestBlock = useBlockNumber()
  return { chainId, latestBlock }
}
