import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.deprecated_text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
const Sub = styled.i`
  align-items: center;
  display: flex;
  justify-content: center;
  text-align: center;
`
interface EmptyStateProps {
  HeaderContent: () => JSX.Element
  SubHeaderContent: () => JSX.Element
}
const EmptyState = ({ HeaderContent, SubHeaderContent }: EmptyStateProps) => (
  <EmptyProposals>
    <ThemedText.DeprecatedBody style={{ marginBottom: '8px' }}>
      <HeaderContent />
    </ThemedText.DeprecatedBody>
    <ThemedText.DeprecatedSubHeader>
      <Sub>
        <SubHeaderContent />
      </Sub>
    </ThemedText.DeprecatedSubHeader>
  </EmptyProposals>
)

export default function ProposalEmptyState() {
  return (
    <EmptyState
      HeaderContent={() => <Trans>No proposals found.</Trans>}
      SubHeaderContent={() => <Trans>Proposals submitted by community members will appear here.</Trans>}
    />
  )
}
