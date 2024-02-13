import { ProposalState } from 'state/governance/hooks'

export const checkProposalState = (
  proposalStatus: ProposalState | undefined,
  currentBlock: number | undefined,
  endBlock: number | undefined
): ProposalState => {
  if (proposalStatus === undefined || currentBlock === undefined || endBlock === undefined) {
    return ProposalState.UNDETERMINED
  }

  if (proposalStatus !== ProposalState.PENDING) return proposalStatus
  if (currentBlock < endBlock) return ProposalState.PENDING
  return ProposalState.COLLECTION_PHASE
}
