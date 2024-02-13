import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { useIsMobile } from 'nft/hooks'
import { useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { shortenString } from 'utils'

import Circle from '../../assets/images/blue-loader.svg'
import { proposalExecutionData, useQueueCallback } from '../../state/governance/hooks'
import { CustomLightSpinner, ThemedText } from '../../theme'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding-top: 16px;
`

interface QueueModalProps {
  isOpen: boolean
  onDismiss: () => void
  proposalId: string | undefined // id for the proposal to queue
  proposalExecutionData: proposalExecutionData | undefined
}

export default function QueueModal({ isOpen, onDismiss, proposalId, proposalExecutionData }: QueueModalProps) {
  const { chainId } = useWeb3React()
  const queueCallback = useQueueCallback()
  const theme = useTheme()
  const isMobile = useIsMobile()

  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onQueue() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!queueCallback) return

    // try delegation and store hash
    const hash = await queueCallback(proposalId, proposalExecutionData)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>
                {proposalId && (
                  <>
                    <Trans>Queue Proposal</Trans> {shortenString(proposalId)}
                  </>
                )}
              </ThemedText.DeprecatedMediumHeader>
              <StyledClosed onClick={wrappedOnDismiss} />
            </RowBetween>
            <RowBetween>
              <ThemedText.DeprecatedBody>
                <Trans>Adding this proposal to the queue will allow it to be executed, after a delay.</Trans>
              </ThemedText.DeprecatedBody>
            </RowBetween>
            <ButtonPrimary onClick={onQueue}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Queue</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ConfirmOrLoadingWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <CustomLightSpinner src={Circle} alt="loader" size={isMobile ? '90px' : '116px'} />
          </ConfirmedIcon>
          <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.DeprecatedLargeHeader
                marginTop={32}
                width="100%"
                textAlign="center"
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Queueing</Trans>
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
            <ThemedText.DeprecatedSubHeader>
              <Trans>Confirm this transaction in your wallet</Trans>
            </ThemedText.DeprecatedSubHeader>
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
      {hash && (
        <ConfirmOrLoadingWrapper>
          <GrayCloseButton onClick={wrappedOnDismiss} />
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.7} size={isMobile ? 116 : 190} color={theme.accentAction} />
          </ConfirmedIcon>
          <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.DeprecatedLargeHeader
                marginTop={32}
                width="100%"
                textAlign="center"
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Transaction Submitted</Trans>
              </ThemedText.DeprecatedLargeHeader>
            </AutoColumn>
            {chainId && (
              <ExternalLink
                href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
                style={{ marginLeft: '4px' }}
              >
                <ThemedText.DeprecatedSubHeader>
                  <Trans>View transaction on Explorer</Trans>
                </ThemedText.DeprecatedSubHeader>
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
