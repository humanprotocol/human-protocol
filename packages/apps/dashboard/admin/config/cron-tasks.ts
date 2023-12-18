import { ChainId, NETWORKS, StatisticsClient } from "@human-protocol/sdk";
import { createPublicClient, http } from "viem";
import {
  bsc,
  bscTestnet,
  goerli,
  mainnet,
  polygon,
  polygonMumbai,
  moonbeam,
  moonbaseAlpha,
  celo,
  celoAlfajores,
} from "viem/chains";
import { formatUnits, parseUnits } from "viem/utils";

const SUPPORTED_CHAINS = {
  [ChainId.MAINNET]: mainnet,
  [ChainId.GOERLI]: goerli,
  [ChainId.BSC_MAINNET]: bsc,
  [ChainId.BSC_TESTNET]: bscTestnet,
  [ChainId.POLYGON]: polygon,
  [ChainId.POLYGON_MUMBAI]: polygonMumbai,
  [ChainId.MOONBEAM]: moonbeam,
  [ChainId.MOONBASE_ALPHA]: moonbaseAlpha,
  [ChainId.CELO]: celo,
  [ChainId.CELO_ALFAJORES]: celoAlfajores,
};

const addBigInts = (a: string, b: string, decimals = 18) => {
  return formatUnits(parseUnits(a, decimals) + parseUnits(b, decimals), decimals);
};

const formatBigNumber = (n: any, decimals = 18) => {
  return formatUnits(n.toBigInt(), decimals);
};

const fetchData = async () => {
  const SUPPORTED_CHAIN_IDS = Object.keys(SUPPORTED_CHAINS);
  const promises = SUPPORTED_CHAIN_IDS.map(async (chainId) => {
    const network = NETWORKS[chainId];
    const client = new StatisticsClient(network);
    const hmtStats = await client.getHMTStatistics();
    const paymentStats = await client.getPaymentStatistics();

    const publicClient = createPublicClient({
      chain: SUPPORTED_CHAINS[chainId],
      transport: http(),
    });
    const totalSupply = await publicClient.readContract({
      address: network.hmtAddress,
      abi: [
        {
          inputs: [],
          name: "totalSupply",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "totalSupply",
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
      try {
        console.log("sync started...");
        const dataItems = await fetchData();

        const allNetworkDataItem = { ...dataItems[0] };
        allNetworkDataItem.chainId = "-1";
        for (let i = 1; i < dataItems.length; i++) {
          const dataItem = dataItems[i];
          dataItem.dailyHMTData.forEach((hmtDayData) => {
            const index = allNetworkDataItem.dailyHMTData.findIndex(
              (d) => d.timestamp.getTime() === hmtDayData.timestamp.getTime()
            );
            if (index === -1) {
              allNetworkDataItem.dailyHMTData.push(hmtDayData);
            } else {
              allNetworkDataItem.dailyHMTData[index].totalTransactionAmount = addBigInts(
                allNetworkDataItem.dailyHMTData[index].totalTransactionAmount,
                hmtDayData.totalTransactionAmount
              );
              allNetworkDataItem.dailyHMTData[index].totalTransactionCount += hmtDayData.totalTransactionCount;
            }
          });
          dataItem.dailyPaymentsData.forEach((paymentDayData) => {
            const index = allNetworkDataItem.dailyPaymentsData.findIndex(
              (d) => d.timestamp.getTime() === paymentDayData.timestamp.getTime()
            );
            if (index === -1) {
              allNetworkDataItem.dailyPaymentsData.push(paymentDayData);
            } else {
              allNetworkDataItem.dailyPaymentsData[index].totalAmountPaid = addBigInts(
                allNetworkDataItem.dailyPaymentsData[index].totalAmountPaid,
                paymentDayData.totalAmountPaid
              );
              allNetworkDataItem.dailyPaymentsData[index].totalCount += paymentDayData.totalCount;
              allNetworkDataItem.dailyPaymentsData[index].averageAmountPerWorker = addBigInts(
                allNetworkDataItem.dailyPaymentsData[index].averageAmountPerWorker,
                paymentDayData.averageAmountPerWorker
              );
            }
          });

          allNetworkDataItem.totalTransferCount += dataItem.totalTransferCount;
          allNetworkDataItem.totalHolders += dataItem.totalHolders;
          allNetworkDataItem.totalTransferAmount = addBigInts(
            allNetworkDataItem.totalTransferAmount,
            dataItem.totalTransferAmount
          );
          allNetworkDataItem.totalSupply = addBigInts(allNetworkDataItem.totalSupply, dataItem.totalSupply);
        }
        allNetworkDataItem.dailyHMTData = allNetworkDataItem.dailyHMTData.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );
        allNetworkDataItem.dailyPaymentsData = allNetworkDataItem.dailyPaymentsData.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        );

        const networkDataItems = [allNetworkDataItem, ...dataItems];
        const uid = "api::network-data-item.network-data-item";
        for (const dataItem of networkDataItems) {
          const entries = await strapi.entityService.findMany(uid, {
            fields: ["chainId"],
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
        console.log("sync ended...");
      } catch (err) {
        console.log(err);
      }
    },
    options: {
      // Every 1 minute
      rule: "*/1 * * * *",
    },
  },
};
