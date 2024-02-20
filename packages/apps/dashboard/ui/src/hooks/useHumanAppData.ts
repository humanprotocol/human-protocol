import { ChainId } from '@human-protocol/sdk';
import useSWR from 'swr';

export function useHumanAppData(chainId: ChainId) {
  return useSWR(
    `human-protocol-dashboard-human-app-data-${chainId}`,
    async () => {
      const apiURL = import.meta.env.VITE_APP_ADMIN_API_URL;
      const responses = await Promise.all([
        fetch(
          `${apiURL}/network-data-items?filters[chainId][$eq]=${chainId}`
        ).then((res) => res.json()),
        fetch(`${apiURL}/daily-task-summaries?pagination[limit]=-1`).then(
          (res) => res.json()
        ),
      ]);
      return responses;
    }
  );
}
