import { authorizedHumanAppApiClient } from '@/api';

const apiPaths = {
  getProposals: '/governance/proposals',
};

export interface ProposalResponse {
  proposalId: string;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  voteStart: number;
  voteEnd: number;
}

export async function fetchProposal(): Promise<ProposalResponse | null> {
  const list = await authorizedHumanAppApiClient.get<ProposalResponse[]>(
    apiPaths.getProposals
  );
  if (!Array.isArray(list) || list.length === 0) return null;

  const now = Math.floor(Date.now() / 1000);
  const activeProposals = list.filter(
    (p) => p.voteStart <= now && now < p.voteEnd
  );
  if (activeProposals.length > 0)
    return activeProposals.sort((a, b) => a.voteEnd - b.voteEnd)[0];

  const pendingProposals = list.filter((p) => now < p.voteStart);
  if (pendingProposals.length > 0)
    return pendingProposals.sort((a, b) => a.voteStart - b.voteStart)[0];

  return null;
}
