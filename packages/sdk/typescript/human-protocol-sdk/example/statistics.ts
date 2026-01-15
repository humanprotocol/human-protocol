/* eslint-disable no-console */
import { StatisticsUtils } from '../src/statistics';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';

(async () => {
  const networkData = NETWORKS[ChainId.POLYGON];
  if (!networkData) {
    return;
  }

  console.log(
    'Escrow statistics:',
    await StatisticsUtils.getEscrowStatistics(networkData)
  );

  console.log(
    'Escrow statistics from 5/8 - 6/8:',
    await StatisticsUtils.getEscrowStatistics(networkData, {
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  );

  console.log(
    'Worker statistics:',
    await StatisticsUtils.getWorkerStatistics(networkData)
  );

  console.log(
    'Worker statistics from 5/8 - 6/8:',
    await StatisticsUtils.getWorkerStatistics(networkData, {
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  );

  const paymentStatistics =
    await StatisticsUtils.getPaymentStatistics(networkData);

  console.log('Payment statistics:', {
    ...paymentStatistics,
    dailyPaymentsData: paymentStatistics.dailyPaymentsData.map((p) => ({
      ...p,
      totalAmountPaid: p.totalAmountPaid.toString(),
      averageAmountPerWorker: p.averageAmountPerWorker.toString(),
    })),
  });

  const paymentStatisticsRange = await StatisticsUtils.getPaymentStatistics(
    networkData,
    {
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    }
  );

  console.log('Payment statistics from 5/8 - 6/8:', {
    ...paymentStatisticsRange,
    dailyPaymentsData: paymentStatisticsRange.dailyPaymentsData.map((p) => ({
      ...p,
      totalAmountPaid: p.totalAmountPaid.toString(),
      averageAmountPerWorker: p.averageAmountPerWorker.toString(),
    })),
  });

  const hmtStatistics = await StatisticsUtils.getHMTStatistics(networkData);

  console.log('HMT statistics:', {
    ...hmtStatistics,
    totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
    totalTransferCount: hmtStatistics.totalTransferCount,
  });
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
