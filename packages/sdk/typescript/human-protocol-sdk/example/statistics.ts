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
    totalTransferCount: hmtStatistics.totalTransferCount,
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

const getDailyStats = async (statisticsClient: StatisticsClient) => {
  const dailyStats = await statisticsClient.getDailyStats();

  console.log('Daily statistics:', dailyStats);

  const dailyStatsRange = await statisticsClient.getDailyStats({
    startDate: new Date(2023, 4, 8),
    endDate: new Date(2023, 5, 8),
  });

  console.log('Daily statistics from 5/8 - 6/8:', dailyStatsRange);
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
  await getDailyStats(statisticsClient);
})();
