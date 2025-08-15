import { useQuery } from '@tanstack/react-query';
import { fetchProposal } from '../services/governance.service';

export function useProposalQuery() {
  return useQuery({
    queryKey: ['governanceProposal'],
    queryFn: fetchProposal,
  });
}
