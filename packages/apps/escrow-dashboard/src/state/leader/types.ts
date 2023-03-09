import { ChainId } from 'src/constants';

export type LeaderData = {
  chainId: ChainId;
  address: string;
  role: string;
  amountStaked: number;
  amountAllocated: number;
  amountLocked: number;
  amountSlashed: number;
  amountWithdrawn: number;
  lockedUntilTimestamp: number;
  reputation: number;
  amountJobsLaunched: number;
  url?: string;
};

export type LeaderEscrowData = {
  address: string;
  amountAllocated: number;
  amountPayout: number;
  status: string;
};
