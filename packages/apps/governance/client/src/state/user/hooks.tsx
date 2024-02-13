import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { SupportedLocale } from 'constants/locales'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { UserAddedToken } from 'types/tokens'

import { updateUserLocale } from './reducer'
import { SerializedToken } from './types'

export function deserializeToken(serializedToken: SerializedToken, Class: typeof Token = Token): Token {
  return new Class(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function useUserLocale(): SupportedLocale | null {
  return useAppSelector((state) => state.user.userLocale)
}

export function useUserLocaleManager(): [SupportedLocale | null, (newLocale: SupportedLocale) => void] {
  const dispatch = useAppDispatch()
  const locale = useUserLocale()

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      dispatch(updateUserLocale({ userLocale: newLocale }))
    },
    [dispatch]
  )

  return [locale, setLocale]
}

export function useIsExpertMode(): boolean {
  return useAppSelector((state) => state.user.userExpertMode)
}

function useUserAddedTokensOnChain(chainId: number | undefined | null): Token[] {
  const serializedTokensMap = useAppSelector(({ user: { tokens } }) => tokens)

  return useMemo(() => {
    if (!chainId) return []
    const tokenMap: Token[] = serializedTokensMap?.[chainId]
      ? Object.values(serializedTokensMap[chainId]).map((value) => deserializeToken(value, UserAddedToken))
      : []
    return tokenMap
  }, [serializedTokensMap, chainId])
}

export function useUserAddedTokens(): Token[] {
  return useUserAddedTokensOnChain(useWeb3React().chainId)
}
