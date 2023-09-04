/* eslint-disable no-console */
import { StatisticsClient } from '../src/statistics';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';

export const getStatistics = async () => {
  if (!NETWORKS[ChainId.POLYGON_MUMBAI]) {
    return;
  }

  const statisticsClient = new StatisticsClient(
    NETWORKS[ChainId.POLYGON_MUMBAI]
  );

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

  console.log(
    'Payment statistics:',
    (await statisticsClient.getPaymentStatistics()).dailyPaymentsData.map(
      (p) => ({
        ...p,
        totalAmountPaid: p.totalAmountPaid.toString(),
        averageAmountPerJob: p.averageAmountPerJob.toString(),
        averageAmountPerWorker: p.averageAmountPerWorker.toString(),
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
      averageAmountPerJob: p.averageAmountPerJob.toString(),
      averageAmountPerWorker: p.averageAmountPerWorker.toString(),
    }))
  );

  const hmtStatistics = await statisticsClient.getHMTStatistics();

  console.log('HMT statistics:', {
    ...hmtStatistics,
    totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
    holders: hmtStatistics.holders.map((h) => ({
      ...h,
      balance: h.balance.toString(),
    })),
    dailyHMTData: hmtStatistics.dailyHMTData.map((d) => ({
      ...d,
      totalTransactionAmount: d.totalTransactionAmount.toString(),
    })),
  });

  const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
    from: new Date(2023, 4, 8),
    to: new Date(2023, 5, 8),
  });

  console.log('HMT statistics from 5/8 - 6/8:', {
    ...hmtStatisticsRange,
    totalTransferAmount: hmtStatisticsRange.totalTransferAmount.toString(),
    holders: hmtStatisticsRange.holders.map((h) => ({
      ...h,
      balance: h.balance.toString(),
    })),
    dailyHMTData: hmtStatisticsRange.dailyHMTData.map((d) => ({
      ...d,
      totalTransactionAmount: d.totalTransactionAmount.toString(),
    })),
  });
};

(async () => {
  getStatistics();
})();
