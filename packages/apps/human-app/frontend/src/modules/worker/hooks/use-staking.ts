import { useQuery } from '@tanstack/react-query';
import { getStakingSummary } from '../services/staking.service';

function useGetStakingSummary() {
  return useQuery({
    queryKey: ['staking-summary'],
    queryFn: () => getStakingSummary(),
  });
}

export { useGetStakingSummary };
