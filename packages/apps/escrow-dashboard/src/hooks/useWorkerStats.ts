import { ChainId } from '@human-protocol/sdk';
import axios from 'axios';
import dayjs from 'dayjs';
import useSWR from 'swr';
import { useChainId } from 'src/state/humanAppData/hooks';

export function useWorkerStats() {
  const chainId = useChainId();
  return useSWR(
    `human-protocol-dashboard-worker-stats-${chainId}`,
    async () => {
      if (chainId !== ChainId.POLYGON) return null;

      const apiURL = import.meta.env.VITE_APP_ADMIN_API_URL;
      const to = dayjs().format('YYYY-MM-DD');
      const from = dayjs().subtract(60, 'days').format('YYYY-MM-DD');
      const { data } = await axios.get(
        `${apiURL}/stats/workers?to=${to}&from=${from}`
      );

      return data;
    }
  );
}
