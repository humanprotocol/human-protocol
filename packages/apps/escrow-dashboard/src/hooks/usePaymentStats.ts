import { NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import { utils } from 'ethers';
import useSWR from 'swr';
import { HM_TOKEN_DECIMALS } from 'src/constants';
import { useChainId } from 'src/state/humanAppData/hooks';

export function usePaymentStats() {
  const chainId = useChainId();
  return useSWR(
    `human-protocol-dashboard-payment-stats-${chainId}`,
    async () => {
      const network = NETWORKS[chainId];
      if (!network) return null;
      const client = new StatisticsClient(network);

      const stats = await client.getPaymentStatistics();

      return {
        dailyPaymentsData: stats.dailyPaymentsData.map((d) => ({
          ...d,
          totalAmountPaid: utils.formatUnits(
            d.totalAmountPaid,
            HM_TOKEN_DECIMALS
          ),
          averageAmountPerJob: utils.formatUnits(
            d.averageAmountPerJob,
            HM_TOKEN_DECIMALS
          ),
          averageAmountPerWorker: utils.formatUnits(
            d.averageAmountPerWorker,
            HM_TOKEN_DECIMALS
          ),
        })),
      };
    }
  );
}
