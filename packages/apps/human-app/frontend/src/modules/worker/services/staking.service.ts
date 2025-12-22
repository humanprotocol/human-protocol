import { authorizedHumanAppApiClient } from '@/api';

interface StakeSummary {
  exchange_stake: string;
  exchange_error?: string;
  on_chain_stake: string;
  on_chain_error?: string;
  min_threshold: string;
}

async function getStakingSummary(): Promise<StakeSummary | null> {
  const response =
    await authorizedHumanAppApiClient.get<StakeSummary>('/staking/summary');
  return response || null;
}

export { getStakingSummary };
