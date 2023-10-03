import { ChainId, NETWORKS } from '@human-protocol/sdk';
import useSWR from 'swr';
import { useChainId } from 'src/state/humanAppData/hooks';

export function useTaskStats() {
  const chainId = useChainId();
  return useSWR(`human-protocol-dashboard-task-stats-${chainId}`, async () => {
    const network = NETWORKS[chainId];
    if (chainId !== ChainId.POLYGON || !network) return null;

    return [];
  });
}
