import { TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import ExchangeHmtInput from 'components/ExchangeHmtInput/ExchangeHmtInput'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { useHmtContractToken } from 'lib/hooks/useCurrencyBalance'
import { useIsMobile } from 'nft/hooks'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import { useUniContract } from 'state/governance/hooks'
import { useHMTUniContract } from 'state/governance/hooks'
import { ExchangeInputErrors } from 'state/governance/types'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import styled, { useTheme } from 'styled-components/macro'
import { floatStringToIntegerString } from 'utils/floatStringToIntegerString'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { trimTrailingZeros } from 'utils/trimTrailingZeros'

import { ThemedText } from '../../theme'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView, SubmittedWithErrorView } from '../ModalViews'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)<{ padding?: boolean }>`
  width: 100%;
  padding: ${({ padding }) => (padding ? '24px' : '24px 0')};
  text-align: center;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

const ModalViewWrapper = styled('div')`
  width: 100%;
  padding-top: 16px;
`

const StyledRowBetween = styled(RowBetween)`
  word-break: break-all;
  text-align: left;
`

interface DepositHMTProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
  hmtBalance: CurrencyAmount<Token> | undefined
}

export default function DepositHMTModal({ isOpen, onDismiss, title, hmtBalance }: DepositHMTProps) {
  const { account } = useWeb3React()
  const { hmtUniContract } = useHMTUniContract()
  const hmtContractToken = useHmtContractToken()
  const uniContract = useUniContract()
  const theme = useTheme()
  const addTransaction = useTransactionAdder()
  const isMobile = useIsMobile()

  const [attempting, setAttempting] = useState(false)
  const [currencyToExchange, setCurrencyToExchange] = useState<string>('')
  const [approveHash, setApproveHash] = useState<string | undefined>()
  const [depositForHash, setDepositForHash] = useState<string | undefined>()
  const [validationInputError, setValidationInputError] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isTransactionApproved, setIsTransactionApproved] = useState<boolean>(false)
  const [isApproveWaitResponse, setIsApproveWaitResponse] = useState<boolean>(false)

  const userHmtBalanceAmount = hmtBalance && hmtBalance.toFixed()
  const userFormattedHmtBalanceAmount = userHmtBalanceAmount && floatStringToIntegerString(userHmtBalanceAmount)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setAttempting(false)
    setCurrencyToExchange('')
    setApproveHash(undefined)
    setDepositForHash(undefined)
    setValidationInputError('')
    setError('')
    setIsTransactionApproved(false)
    setIsApproveWaitResponse(false)
    onDismiss()
  }

  function onInputHmtExchange(value: string) {
    setCurrencyToExchange(value)
    setValidationInputError('')
  }

  function onInputMaxExchange(maxValue: string | undefined) {
    maxValue && setCurrencyToExchange(maxValue)
    setValidationInputError('')
  }

  const transactionAdder = useCallback(
    (response: TransactionResponse, convertedCurrency: string) => {
      addTransaction(response, {
        type: TransactionType.EXCHANGE_CURRENCY,
        spender: account,
        currencyAmount: convertedCurrency,
      })
    },
    [account, addTransaction]
  )

  async function onTransactionApprove() {
    const convertedCurrency = parseUnits(currencyToExchange, hmtContractToken?.decimals).toString()

    if (!uniContract || !hmtUniContract) return
    if (currencyToExchange.length === 0 || currencyToExchange === '0') {
      setValidationInputError(ExchangeInputErrors.EMPTY_INPUT)
      return
    }

    if (userHmtBalanceAmount && BigNumber.from(userFormattedHmtBalanceAmount).lt(BigNumber.from(convertedCurrency))) {
      setValidationInputError(ExchangeInputErrors.EXCEEDS_BALANCE)
      return
    }

    try {
      setAttempting(true)

      const response = await hmtUniContract.approve(uniContract.address, convertedCurrency)

      if (response) setApproveHash(response.hash)

      const approveResponse = await response.wait()

      if (approveResponse.status === 1) {
        setIsTransactionApproved(true)
        await onDepositHmtSubmit()
      }

      setIsApproveWaitResponse(Boolean(approveResponse))
    } catch (error) {
      setError(error)
      setAttempting(false)
    }
  }

  async function onDepositHmtSubmit() {
    if (!uniContract) return

    const convertedCurrency = parseUnits(currencyToExchange, hmtContractToken?.decimals).toString()

    try {
      setAttempting(true)
      const response = await uniContract.depositFor(account, convertedCurrency)
      transactionAdder(response, convertedCurrency)
      setDepositForHash(response ? response.hash : undefined)
    } catch (error) {
      setError(error)
      setAttempting(false)
      setIsTransactionApproved(false)
    }
  }

  const isDepositFullySubmitted = attempting && Boolean(depositForHash) && isTransactionApproved
  const isDepositError = !attempting && Boolean(error) && !isTransactionApproved

  return (
    <Modal isOpen={isOpen || !!error || isApproveWaitResponse} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !approveHash && !depositForHash && isOpen && !error && (
        <ContentWrapper gap="lg" padding={true}>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader
                textAlign="center"
                fontWeight={isMobile ? 500 : 600}
                fontSize={isMobile ? 20 : 28}
                width="100%"
                marginBottom={isMobile ? 16 : 0}
              >
                {title}
              </ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke={theme.textPrimary} onClick={wrappedOnDismiss} />
            </RowBetween>
            <StyledRowBetween>
              <ThemedText.BodySecondary>
                <Trans>HMT balance</Trans>: {trimTrailingZeros(userHmtBalanceAmount)}
              </ThemedText.BodySecondary>
            </StyledRowBetween>
            <ExchangeHmtInput
              value={currencyToExchange}
              maxValue={trimTrailingZeros(userHmtBalanceAmount)}
              onChange={onInputHmtExchange}
              onMaxChange={onInputMaxExchange}
              error={validationInputError}
              className="hmt-deposit-input"
            />
            <ButtonPrimary disabled={!!error} onClick={onTransactionApprove}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Confirm</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !depositForHash && !isApproveWaitResponse && !validationInputError && (
        <ContentWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <LoadingView onDismiss={wrappedOnDismiss} label="Depositing tokens">
            <AutoColumn gap="md" justify="center">
              <ThemedText.HeadlineSmall fontWeight={500} textAlign="center">
                {approveHash && !isTransactionApproved ? (
                  <Trans>Wait for the approve transaction to be confirmed</Trans>
                ) : (
                  <Trans>Confirm this transaction in your wallet</Trans>
                )}
              </ThemedText.HeadlineSmall>
              {isApproveWaitResponse && Boolean(!error) && (
                <ThemedText.BodyPrimary textAlign="center" fontSize={32} marginBottom={36} marginTop={36}>
                  <span>{currencyToExchange} </span>
                  HMT will be deposited
                </ThemedText.BodyPrimary>
              )}
            </AutoColumn>
          </LoadingView>
        </ContentWrapper>
      )}

      {isDepositFullySubmitted && (
        <ModalViewWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <SubmittedView onDismiss={wrappedOnDismiss} hash={depositForHash}>
            <AutoColumn justify="center">
              <ThemedText.DeprecatedLargeHeader
                width="100%"
                textAlign="center"
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Transaction Submitted</Trans>
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
          </SubmittedView>
        </ModalViewWrapper>
      )}
      {isDepositError && (
        <ModalViewWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <SubmittedWithErrorView onDismiss={wrappedOnDismiss}>
            <AutoColumn justify="center">
              <ContentWrapper gap="10px">
                <ThemedText.DeprecatedError
                  error={!!error}
                  fontSize={isMobile ? 20 : 34}
                  fontWeight={isMobile ? 500 : 600}
                >
                  {swapErrorToUserReadableMessage(error)}
                </ThemedText.DeprecatedError>
              </ContentWrapper>

              {error && (
                <ThemedText.BodySmall fontSize={16}>
                  <Trans>Unable to execute transaction</Trans>
                </ThemedText.BodySmall>
              )}
            </AutoColumn>
          </SubmittedWithErrorView>
        </ModalViewWrapper>
      )}
    </Modal>
  )
}
