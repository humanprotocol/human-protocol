import { Trans } from '@lingui/macro'
import styled, { DefaultTheme } from 'styled-components/macro'

import { ProposalState } from '../../state/governance/hooks'

const handleColorType = (status: ProposalState, theme: DefaultTheme) => {
  switch (status) {
    case ProposalState.PENDING:
    case ProposalState.ACTIVE:
    case ProposalState.SUCCEEDED:
    case ProposalState.COLLECTION_PHASE:
      return theme.accentSuccess
    case ProposalState.EXECUTED:
      return theme.textPrimary
    case ProposalState.DEFEATED:
      return theme.accentOrange
    case ProposalState.CANCELED:
    case ProposalState.EXPIRED:
      return theme.accentFailure
    case ProposalState.QUEUED:
    default:
      return theme.textSecondary
  }
}

function StatusText({ status }: { status: ProposalState }) {
  switch (status) {
    case ProposalState.PENDING:
      return <Trans>Pending</Trans>
    case ProposalState.COLLECTION_PHASE:
      return <Trans>Collection Phase</Trans>
    case ProposalState.ACTIVE:
      return <Trans>Active</Trans>
    case ProposalState.SUCCEEDED:
      return <Trans>Succeeded</Trans>
    case ProposalState.EXECUTED:
      return <Trans>Executed</Trans>
    case ProposalState.DEFEATED:
      return <Trans>Defeated</Trans>
    case ProposalState.QUEUED:
      return <Trans>Queued</Trans>
    case ProposalState.CANCELED:
      return <Trans>Canceled</Trans>
    case ProposalState.EXPIRED:
      return <Trans>Expired</Trans>
    default:
      return <Trans>Undetermined</Trans>
  }
}

const StyledProposalStatusContainer = styled.div<{ status: ProposalState }>`
  display: flex;
  align-items: center;
  margin-left: auto;
  text-align: center;
  padding: 0.5rem;
  gap: 14px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  color: ${({ status, theme }) => handleColorType(status, theme)};
`

const Dot = styled.div<{ status: ProposalState }>`
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background-color: ${({ status, theme }) => handleColorType(status, theme)};
`

export function ProposalStatus({ status }: { status: ProposalState }) {
  return (
    <StyledProposalStatusContainer status={status}>
      <Dot status={status} />
      <StatusText status={status} />
    </StyledProposalStatusContainer>
  )
}
