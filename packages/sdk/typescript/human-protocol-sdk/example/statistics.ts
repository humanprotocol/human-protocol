/* eslint-disable no-console */
import { StatisticsClient } from '../src/statistics';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';

const getEscrowStatistics = async (statisticsClient: StatisticsClient) => {
  console.log(
    'Escrow statistics:',
    await statisticsClient.getEscrowStatistics()
  );

  console.log(
    'Escrow statistics from 5/8 - 6/8:',
    await statisticsClient.getEscrowStatistics({
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  );
};

const getWorkerStatistics = async (statisticsClient: StatisticsClient) => {
  console.log(
    'Worker statistics:',
    await statisticsClient.getWorkerStatistics()
  );

  console.log(
    'Worker statistics from 5/8 - 6/8:',
    await statisticsClient.getWorkerStatistics({
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  );
};

const getPaymentStatistics = async (statisticsClient: StatisticsClient) => {
  console.log(
    'Payment statistics:',
    (await statisticsClient.getPaymentStatistics()).dailyPaymentsData.map(
      (p) => ({
        ...p,
        totalAmountPaid: p.totalAmountPaid.toString(),
      })
    )
  );

  console.log(
    'Payment statistics from 5/8 - 6/8:',
    (
      await statisticsClient.getPaymentStatistics({
        from: new Date(2023, 4, 8),
        to: new Date(2023, 5, 8),
      })
    ).dailyPaymentsData.map((p) => ({
      ...p,
      totalAmountPaid: p.totalAmountPaid.toString(),
    }))
  );
};

const getHMTStatistics = async (statisticsClient: StatisticsClient) => {
  const hmtStatistics = await statisticsClient.getHMTStatistics();

  console.log('HMT statistics:', {
    ...hmtStatistics,
    totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
    totalTransferCount: hmtStatistics.totalTransferCount,
  });
};

(async () => {
  if (!NETWORKS[ChainId.POLYGON]) {
    return;
  }

  const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON]);

  await getEscrowStatistics(statisticsClient);
  await getWorkerStatistics(statisticsClient);
  await getPaymentStatistics(statisticsClient);
  await getHMTStatistics(statisticsClient);
})();
