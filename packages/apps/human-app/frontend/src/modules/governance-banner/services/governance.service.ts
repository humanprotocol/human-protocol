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
  const active = list
    .filter((p) => p.voteStart <= now && now < p.voteEnd)
    .sort((a, b) => a.voteEnd - b.voteEnd);
  if (active.length > 0) return active[0];

  const pending = list
    .filter((p) => now < p.voteStart)
    .sort((a, b) => a.voteStart - b.voteStart);
  if (pending.length > 0) return pending[0];

  return null;
}
