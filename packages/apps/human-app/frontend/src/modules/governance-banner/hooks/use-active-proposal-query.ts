import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import * as wagmiChains from 'wagmi/chains';
import GovernorABI from '@/modules/smart-contracts/abi/MetaHumanGovernor.json';
import { env } from '@/shared/env';

enum ProposalState {
  PENDING,
  ACTIVE,
  CANCELED,
  DEFEATED,
  SUCCEEDED,
  QUEUED,
  EXPIRED,
  EXECUTED,
}

async function fetchActiveProposalFn() {
  const provider = new ethers.JsonRpcProvider(
    env.VITE_NETWORK === 'mainnet'
      ? wagmiChains.polygon.rpcUrls.default.http[0]
      : wagmiChains.sepolia.rpcUrls.default.http[0]
  );
  const contract = new ethers.Contract(
    env.VITE_GOVERNOR_ADDRESS,
    GovernorABI,
    provider
  );
  const filter = contract.filters.ProposalCreated();
  const logs = await contract.queryFilter(filter, 68058296, 'latest');

  for (const log of logs) {
    const parsed = contract.interface.parseLog(log);
    const proposalId = parsed?.args.proposalId as ethers.BigNumberish;
    const state = Number(await contract.state(proposalId)) as ProposalState;

    if (state === ProposalState.ACTIVE) {
      const votesResult = (await contract.proposalVotes(proposalId)) as [
        ethers.BigNumberish,
        ethers.BigNumberish,
        ethers.BigNumberish,
      ];
      const [againstBn, forBn, abstainBn] = votesResult;
      const forVotes = ethers.formatEther(forBn);
      const againstVotes = ethers.formatEther(againstBn);
      const abstainVotes = ethers.formatEther(abstainBn);

      const deadline = Number(await contract.proposalDeadline(proposalId));

      return {
        proposalId: proposalId.toString(),
        forVotes,
        againstVotes,
        abstainVotes,
        deadline,
      };
    }
  }

  return null;
}

export function useActiveProposalQuery() {
  return useQuery({
    queryKey: ['governanceActiveProposal'],
    queryFn: fetchActiveProposalFn,
  });
}
