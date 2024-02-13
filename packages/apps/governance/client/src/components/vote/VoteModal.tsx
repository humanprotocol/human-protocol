import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import GrayCloseButton from 'components/GrayCloseButton/GrayCloseButton'
import { LoadingView } from 'components/ModalViews'
import { useIsMobile } from 'nft/hooks'
import { useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { shortenString } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { useVoteCallback } from '../../state/governance/hooks'
import { VoteOption } from '../../state/governance/types'
import { ThemedText } from '../../theme'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px 32px 32px 32px;
`

const TopLabelContainer = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;

  > div {
    font-size: 28px;

    @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.xs}px`}) {
      font-size: 22px;
    }
  }
`

const StyledClosed = styled(X)`
  position: absolute;
  right: 5%;
  :hover {
    cursor: pointer;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    display: none;
  }
`

const ConfirmOrLoadingWrapper = styled.div`
  position: relative;
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding-top: 16px;
`

interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  voteOption: VoteOption | undefined
  proposalId: string | undefined // id for the proposal to vote on
  availableVotes: CurrencyAmount<Token> | undefined // id for the proposal to vote on
  id: string
}

export default function VoteModal({ isOpen, onDismiss, proposalId, voteOption, availableVotes, id }: VoteModalProps) {
  const { chainId } = useWeb3React()
  const voteCallback = useVoteCallback()
  const isMobile = useIsMobile()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)

  // get theme for colors
  const theme = useTheme()

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onVote() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!voteCallback || voteOption === undefined) return

    // try delegation and store hash
    const hash = await voteCallback(proposalId, voteOption)?.catch((error) => {
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
          <AutoColumn gap="xl" justify="center">
            <TopLabelContainer>
              <ThemedText.HeadlineSmall>
                {voteOption === VoteOption.Against ? (
                  <Trans>Vote against proposal</Trans>
                ) : voteOption === VoteOption.For ? (
                  <Trans>Vote for proposal</Trans>
                ) : (
                  <Trans>Abstain from proposal</Trans>
                )}
              </ThemedText.HeadlineSmall>
              <StyledClosed onClick={wrappedOnDismiss} />
            </TopLabelContainer>
            <ThemedText.BodyPrimary fontWeight={400}>
              <Trans>{`You're voting for proposal`} </Trans> {shortenString(id)}
            </ThemedText.BodyPrimary>
            <ThemedText.HeadlineLarge>
              {formatCurrencyAmount(availableVotes, 4)} <Trans>Votes</Trans>
            </ThemedText.HeadlineLarge>
            <ButtonPrimary onClick={onVote}>
              <ThemedText.BodyPrimary color="white" fontSize={15}>
                {voteOption === VoteOption.Against ? (
                  <Trans>Vote against</Trans>
                ) : voteOption === VoteOption.For ? (
                  <Trans>Vote for</Trans>
                ) : (
                  <Trans>Vote to abstain</Trans>
                )}
              </ThemedText.BodyPrimary>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ContentWrapper>
          <GrayCloseButton onClick={onDismiss} />
          <LoadingView onDismiss={wrappedOnDismiss}>
            <AutoColumn gap="md" justify="center">
              <ThemedText.HeadlineSmall fontWeight={500} textAlign="center">
                Confirm this transaction in your wallet
              </ThemedText.HeadlineSmall>
            </AutoColumn>
          </LoadingView>
        </ContentWrapper>
      )}
      {hash && (
        <ConfirmOrLoadingWrapper>
          <GrayCloseButton onClick={onDismiss} />
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.7} size={isMobile ? 116 : 190} color={theme.accentAction} />
          </ConfirmedIcon>
          <AutoColumn gap={isMobile ? '24px' : '48px'} justify="center">
            <AutoColumn gap="md" justify="center">
              <ThemedText.HeadlineLarge
                marginTop={32}
                width="100%"
                textAlign="center"
                fontSize={isMobile ? 20 : 36}
                fontWeight={isMobile ? 500 : 600}
              >
                <Trans>Transaction Submitted</Trans>
              </ThemedText.HeadlineLarge>
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
