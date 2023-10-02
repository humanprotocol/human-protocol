/* eslint-disable no-console */
import { StatisticsClient } from '../src/statistics';
import { NETWORKS } from '../src/constants';
import { ChainId } from '../src/enums';

// Replace with your own API key
const IM_API_KEY = '';

const getTaskStatistics = async (statisticsClient: StatisticsClient) => {
  console.log('Task statistics:', await statisticsClient.getTaskStatistics());

  console.log(
    'Task statistics from 5/8 - 6/8:',
    await statisticsClient.getTaskStatistics({
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  );
};

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
};

const getHMTStatistics = async (statisticsClient: StatisticsClient) => {
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
  if (!NETWORKS[ChainId.POLYGON]) {
    return;
  }

  const statisticsClient = new StatisticsClient(
    NETWORKS[ChainId.POLYGON],
    IM_API_KEY
  );

  await getTaskStatistics(statisticsClient);
  await getEscrowStatistics(statisticsClient);
  await getWorkerStatistics(statisticsClient);
  await getPaymentStatistics(statisticsClient);
  await getHMTStatistics(statisticsClient);
})();
