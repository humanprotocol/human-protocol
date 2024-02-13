import { BigNumber } from '@ethersproject/bignumber'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useDebounce from 'hooks/useDebounce'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useEffect, useState } from 'react'
import { useHMTUniContract, useUniContract } from 'state/governance/hooks'
import { useAppSelector } from 'state/hooks'

import { isAddress } from '../../utils'

// Returns HMT token
export function useHmtContractToken() {
  const uniContract = useUniContract()
  const { account, chainId } = useWeb3React()

  const [hmtToken, setHmtToken] = useState<Token | undefined>(undefined)

  useEffect(() => {
    const fetchUnderlyingAddress = async () => {
      try {
        if (uniContract && uniContract.signer && account) {
          const address = await uniContract.underlying()
          const hmtToken = address && chainId && new Token(chainId, address, 18, 'HMT', 'Human')
          setHmtToken(hmtToken)
        }
      } catch (error) {
        console.log(error)
      }
    }

    fetchUnderlyingAddress()
  }, [uniContract, account, chainId])

  return hmtToken
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }, boolean] {
  const [vhmtBalance, setVhmtBalance] = useState<BigNumber[]>([])
  const [hmtBalance, setHmtBalance] = useState<BigNumber[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const { account, chainId } = useWeb3React() // we cannot fetch balances cross-chain

  const uniContract = useUniContract()

  const { hmtUniContract, loading: hmtContractLoading, handleSetHMTLoading } = useHMTUniContract()

  const transactions = useAppSelector((state) => state.transactions)

  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false && t?.chainId === chainId) ?? [],
    [chainId, tokens]
  )

  const tokenChainId = tokens && tokens[0]?.chainId
  const tokenAddress = tokens && tokens[0]?.address

  const debouncedHmtUniContract = useDebounce(hmtUniContract, 500)

  const contractMatches = debouncedHmtUniContract?.address === tokenAddress

  useEffect(() => {
    const fetchBalanceVHMT = async () => {
      setIsLoading(true)
      if (uniContract?.signer && address && account && tokenChainId === chainId) {
        try {
          const resultVHMT = await uniContract.functions.balanceOf(account)
          if (resultVHMT) setVhmtBalance(resultVHMT)
        } catch (error) {
          console.log('Error inside fetchBalanceVHMT')
          console.log(error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchBalanceVHMT()
  }, [account, uniContract, transactions, chainId])

  useEffect(() => {
    const fetchBalanceHMT = async () => {
      setIsLoading(true)
      handleSetHMTLoading(true)

      if (
        debouncedHmtUniContract?.signer &&
        !hmtContractLoading &&
        address &&
        account &&
        tokenChainId === chainId &&
        contractMatches
      ) {
        try {
          const resultHMT = await debouncedHmtUniContract.functions.balanceOf(account)
          if (resultHMT) setHmtBalance(resultHMT)
        } catch (error) {
          console.log('Error inside fetchBalanceHMT')
          console.log(error)
        } finally {
          setIsLoading(false)
          handleSetHMTLoading(false)
        }
      }
    }

    fetchBalanceHMT()
  }, [account, debouncedHmtUniContract, transactions, chainId])

  return useMemo(
    () => [
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }>((memo, token) => {
            const amount = vhmtBalance ? JSBI.BigInt(vhmtBalance.toString()) : undefined
            const hmtAmount = hmtBalance ? JSBI.BigInt(hmtBalance.toString()) : undefined

            if (amount) {
              memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
            }

            if (hmtAmount && hmtUniContract) {
              memo[hmtUniContract.address] = CurrencyAmount.fromRawAmount(token, hmtAmount)
            }
            return memo
          }, {})
        : {},
      isLoading,
    ],
    [address, validatedTokens, isLoading, vhmtBalance, hmtBalance, hmtUniContract]
  )
}

function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  const tokenBalances = useTokenBalances(
    account,
    useMemo(() => [token], [token])
  )
  if (!token) return undefined
  return tokenBalances[token.address]
}
