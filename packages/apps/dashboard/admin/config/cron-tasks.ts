import { ChainId, NETWORKS, StatisticsClient } from '@human-protocol/sdk';
import axios from 'axios';
import dayjs from 'dayjs';
import { createPublicClient, http } from 'viem';
import {
  bsc,
  bscTestnet,
  goerli,
  sepolia,
  mainnet,
  polygon,
  polygonAmoy,
  moonbeam,
  moonbaseAlpha,
  celo,
  celoAlfajores,
  xLayer
} from 'viem/chains';
import { formatUnits, parseUnits } from 'viem/utils';

const SUPPORTED_CHAINS = {
  [ChainId.MAINNET]: mainnet,
  [ChainId.GOERLI]: goerli,
  [ChainId.SEPOLIA]: sepolia,
  [ChainId.BSC_MAINNET]: bsc,
  [ChainId.BSC_TESTNET]: bscTestnet,
  [ChainId.POLYGON]: polygon,
  [ChainId.POLYGON_AMOY]: polygonAmoy,
  [ChainId.MOONBEAM]: moonbeam,
  [ChainId.MOONBASE_ALPHA]: moonbaseAlpha,
  [ChainId.CELO]: celo,
  [ChainId.CELO_ALFAJORES]: celoAlfajores,
  [ChainId.XLAYER]: xLayer,
};

const addBigInts = (a: string, b: string, decimals = 18) => {
  return formatUnits(parseUnits(a, decimals) + parseUnits(b, decimals), decimals);
};

const formatBigNumber = (n: any, decimals = 18) => {
  return formatUnits(BigInt(n), decimals);
};

const fetchData = async () => {
  const SUPPORTED_CHAIN_IDS = Object.keys(SUPPORTED_CHAINS);
  const promises = SUPPORTED_CHAIN_IDS.map(async (chainId) => {
    const network = NETWORKS[chainId];
    const client = new StatisticsClient(network);
    const hmtStats = await client.getHMTStatistics();
    const paymentStats = await client.getPaymentStatistics();

    const publicClient: any = createPublicClient({
      chain: SUPPORTED_CHAINS[chainId],
      transport: http(),
    });
    const totalSupply = await publicClient.readContract({
      address: network.hmtAddress,
      abi: [
        {
          inputs: [],
          name: 'totalSupply',
          outputs: [
            {
              internalType: 'uint256',
              name: '',
              type: 'uint256',
            },
          ],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'totalSupply',
    });

    return {
      chainId,
      dailyHMTData: hmtStats.dailyHMTData.map((d) => ({
        ...d,
        totalTransactionAmount: formatBigNumber(d.totalTransactionAmount),
      })),
      dailyPaymentsData: paymentStats.dailyPaymentsData.map((d) => ({
        ...d,
        totalAmountPaid: formatBigNumber(d.totalAmountPaid),
        averageAmountPerWorker: formatBigNumber(d.averageAmountPerWorker),
      })),
      totalTransferAmount: formatBigNumber(hmtStats.totalTransferAmount),
      totalTransferCount: hmtStats.totalTransferCount,
      totalHolders: hmtStats.totalHolders,
      totalSupply: formatUnits(totalSupply, 18),
    };
  });

  const results = await Promise.all(promises);
  return results;
};

export default {
  syncDashboardData: {
    task: async ({ strapi }) => {
      console.log('sync started...');
      try {
        const dataItems = await fetchData();

        const allNetworkDataItem = {
          chainId: '-1',
          dailyHMTData: [],
          dailyPaymentsData: [],
          totalTransferAmount: '0',
          totalTransferCount: 0,
          totalHolders: 0,
          totalSupply: '0',
        };
        for (let i = 0; i < dataItems.length; i++) {
          const dataItem = dataItems[i];
          dataItem.dailyHMTData.forEach((hmtDayData) => {
            const index = allNetworkDataItem.dailyHMTData.findIndex(
              (d) => d.timestamp.getTime() === hmtDayData.timestamp.getTime(),
            );
            if (index === -1) {
              allNetworkDataItem.dailyHMTData.push({ ...hmtDayData });
            } else {
              allNetworkDataItem.dailyHMTData[index].totalTransactionAmount = addBigInts(
                allNetworkDataItem.dailyHMTData[index].totalTransactionAmount,
                hmtDayData.totalTransactionAmount,
              );
              allNetworkDataItem.dailyHMTData[index].totalTransactionCount += hmtDayData.totalTransactionCount;
            }
          });
          dataItem.dailyPaymentsData.forEach((paymentDayData) => {
            const index = allNetworkDataItem.dailyPaymentsData.findIndex(
              (d) => d.timestamp.getTime() === paymentDayData.timestamp.getTime(),
            );
            if (index === -1) {
              allNetworkDataItem.dailyPaymentsData.push({ ...paymentDayData });
            } else {
              allNetworkDataItem.dailyPaymentsData[index].totalAmountPaid = addBigInts(
                allNetworkDataItem.dailyPaymentsData[index].totalAmountPaid,
                paymentDayData.totalAmountPaid,
              );
              allNetworkDataItem.dailyPaymentsData[index].totalCount += paymentDayData.totalCount;
              allNetworkDataItem.dailyPaymentsData[index].averageAmountPerWorker = addBigInts(
                allNetworkDataItem.dailyPaymentsData[index].averageAmountPerWorker,
                paymentDayData.averageAmountPerWorker,
              );
            }
          });

          allNetworkDataItem.totalTransferCount += dataItem.totalTransferCount;
          allNetworkDataItem.totalHolders += dataItem.totalHolders;
          allNetworkDataItem.totalTransferAmount = addBigInts(
            allNetworkDataItem.totalTransferAmount,
            dataItem.totalTransferAmount,
          );
          allNetworkDataItem.totalSupply = addBigInts(allNetworkDataItem.totalSupply, dataItem.totalSupply);
        }
        allNetworkDataItem.dailyHMTData = allNetworkDataItem.dailyHMTData.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        allNetworkDataItem.dailyPaymentsData = allNetworkDataItem.dailyPaymentsData.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        const networkDataItems = [allNetworkDataItem, ...dataItems];
        const uid = 'api::network-data-item.network-data-item';
        for (const dataItem of networkDataItems) {
          const entries = await strapi.entityService.findMany(uid, {
            fields: ['chainId'],
            filters: { chainId: Number(dataItem.chainId) },
          });
          console.log(dataItem.chainId);
          if (entries.length > 0) {
            await strapi.entityService.update(uid, entries[0].id, {
              data: dataItem,
            });
          } else {
            await strapi.entityService.create(uid, { data: dataItem });
          }
        }
        console.log('sync ended...');
      } catch (err) {
        console.log(err);
      }

      console.log('sync daily task summary started...');
      try {
        const uid = 'api::daily-task-summary.daily-task-summary';

        const date = dayjs().format('YYYY-MM-DD');

        const { data } = await axios.get('/support/summary-stats', {
          baseURL: 'https://foundation-accounts.hmt.ai',
          method: 'GET',
          params: {
            start_date: date,
            end_date: date,
            api_key: process.env.HCAPTCHA_LABELING_STAFF_API_KEY,
          },
        });

        const dailyData = {
          date,
          served_count: data[date]?.served ?? 0,
          solved_count: data[date]?.solved ?? 0,
        };

        const entries = await strapi.entityService.findMany(uid, {
          filters: { date },
        });

        if (entries.length > 0) {
          await strapi.entityService.update(uid, entries[0].id, {
            data: dailyData,
          });
        } else {
          await strapi.entityService.create(uid, { data: dailyData });
        }

        console.log('sync daily task summary ended...');
      } catch (err) {
        console.log(err);
      }
    },
    options: {
      // Every 1 minute
      rule: '*/1 * * * *',
    },
  },
  syncMonthlySummaryData: {
    task: async ({ strapi }) => {
      const uid = 'api::monthly-task-summary.monthly-task-summary';
      const entries = await strapi.entityService.findMany(uid);

      let startDate = dayjs('2022-07-01');
      const currentDate = dayjs().subtract(1, 'month').endOf('month');
      const dates = [];

      while (startDate <= currentDate) {
        const from = startDate.startOf('month').format('YYYY-MM-DD');
        const to = startDate.endOf('month').format('YYYY-MM-DD');

        const entry = entries.find((e) => e.date === to);
        if (!entry) {
          dates.push({ from, to });
        }

        startDate = startDate.add(1, 'month');
      }

      const results = await Promise.all(
        dates.map(({ from, to }) =>
          axios
            .get('/support/summary-stats', {
              baseURL: 'https://foundation-accounts.hmt.ai',
              method: 'GET',
              params: {
                start_date: from,
                end_date: to,
                api_key: process.env.HCAPTCHA_LABELING_STAFF_API_KEY,
              },
            })
            .then((res) => res.data),
        ),
      );

      const entriesToCreate = results.map((r, i) => ({
        date: dates[i].to,
        served_count: r.total.served,
        solved_count: r.total.solved,
      }));

      if (entriesToCreate.length > 0) {
        await strapi.db.query(uid).createMany({ data: entriesToCreate });
      }
    },
    options: {
      // Monthly
      rule: '0 0 1 * *',
    },
  },
};
