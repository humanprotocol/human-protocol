import { ChainId } from '@human-protocol/sdk';
import useSWR from 'swr';

export function useHumanAppData(chainId: ChainId) {
  return useSWR(
    `human-protocol-dashboard-human-app-data-${chainId}`,
    async () => {
      const apiURL = import.meta.env.VITE_APP_ADMIN_API_URL;
      const response = await fetch(
        `${apiURL}/network-data-items?filters[chainId][$eq]=${chainId}`
      );
      const json = await response.json();
      return json;
    }
  );
}
