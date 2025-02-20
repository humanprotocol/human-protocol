import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import GovernorABI from '@/modules/smart-contracts/abi/MetaHumanGovernor.json';

const GOVERNOR_ADDRESS = '0x7F508283c1d335b3EdC41B12001Ae584391EFAf4';
const RPC_URL = 'https://polygon-rpc.com';

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
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(GOVERNOR_ADDRESS, GovernorABI, provider);
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
