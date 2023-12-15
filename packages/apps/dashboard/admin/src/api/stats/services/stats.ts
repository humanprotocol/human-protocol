/**
 * stats service
 */

import { ChainId, IStatisticsParams, NETWORKS } from "@human-protocol/sdk";
import { GET_PAYOUTS_QUERY, IMData, PayoutData } from "@human-protocol/sdk/dist/graphql";
import gqlFetch from "graphql-request";
import axios from "axios";

const getIMData = async (params: IStatisticsParams): Promise<IMData> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defaultFromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  defaultFromDate.setDate(today.getDate() - 60);

  const from = params.from ? new Date(params.from) : defaultFromDate;
  const to = params.to ? new Date(params.to) : today;

  // IM API now limits the date range to 60 days, so we need to make multiple requests
  // if the date range is greater than 60 days
  const chunks = [];
  let start = from;
  while (start < to) {
    const end = new Date(start);
    end.setDate(start.getDate() + 60);
    chunks.push({ from: start, to: end.getDate() < to.getDate() ? end : to });
    start = end;
  }

  return await Promise.all(
    chunks.map(({ from, to }) =>
      axios
        .get("/support/summary-stats", {
          baseURL: "https://foundation-accounts.hmt.ai",
          method: "GET",
          params: {
            start_date: from.toISOString().slice(0, 10),
            end_date: to.toISOString().slice(0, 10),
            api_key: process.env.HCAPTCHA_LABELING_STAFF_API_KEY,
          },
        })
        .then((res) => res.data)
    )
  ).then((chunks) =>
    chunks.reduce(
      // Exclude total from the aggregated data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (aggregated, { total, ...chunkData }) => ({
        ...aggregated,
        ...chunkData,
      }),
      {}
    )
  );
};

export default () => ({
  getTasksStats: async (params: IStatisticsParams) => {
    const data = await getIMData(params);

    return {
      dailyTasksData: Object.entries(data).map(([key, value]) => ({
        timestamp: new Date(key),
        tasksTotal: value.served,
        tasksSolved: value.solved,
      })),
    };
  },
  getWorkersStats: async (params: IStatisticsParams) => {
    try {
      const data = await getIMData(params);

      return {
        dailyWorkersData: await Promise.all(
          Object.entries(data).map(async ([key, value]) => {
            const timestamp = new Date(key);
            const fromDate = new Date(key);
            const toDate = new Date(key);
            toDate.setDate(toDate.getDate() + 1);

            const { payouts } = await gqlFetch<{
              payouts: PayoutData[];
            }>(
              NETWORKS[ChainId.POLYGON].subgraphUrl,
              GET_PAYOUTS_QUERY({
                from: fromDate,
                to: toDate,
              }),
              {
                from: fromDate.getTime() / 1000,
                to: toDate.getTime() / 1000,
              }
            );

            const activeWorkers = new Set(payouts.map(({ recipient }) => recipient)).size;

            return {
              timestamp,
              activeWorkers,
              averageJobsSolved: activeWorkers ? value.solved / activeWorkers : 0,
            };
          })
        ),
      };
    } catch (e: any) {
      return { dailyWorkersData: [] };
    }
  },
});
