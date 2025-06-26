import { useMemo } from 'react';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useDebounce } from 'use-debounce';

import apiPaths from '@/shared/api/apiPaths';
import httpClient from '@/shared/api/httpClient';
import validateResponse from '@/shared/lib/validateResponse';

import {
  hcaptchaDailyStatsSchema,
  HcaptchaDailyStats,
} from '../model/hcaptchaDailyStatsSchema';
import {
  hmtDailyStatsSchema,
  HMTDailyStats,
} from '../model/hmtDailyStatsSchema';

export type ChartData = (HMTDailyStats & Omit<HcaptchaDailyStats, 'date'>)[];

const mergeResponses = (
  hcaptchaStatsResults: HcaptchaDailyStats[],
  hmtStatsResults: HMTDailyStats[]
): ChartData => {
  const allDates = Array.from(
    new Set([
      ...hcaptchaStatsResults.map(({ date }) => date),
      ...hmtStatsResults.map(({ date }) => date),
    ])
  ).sort((a, b) => (dayjs(a).isBefore(dayjs(b)) ? -1 : 1));

  const hcaptchaStatsResultsMap = new Map<string, HcaptchaDailyStats>();
  const hmtStatsResultsMap = new Map<string, HMTDailyStats>();

  hcaptchaStatsResults.forEach((entry) => {
    hcaptchaStatsResultsMap.set(entry.date, entry);
  });

  hmtStatsResults.forEach((entry) => {
    hmtStatsResultsMap.set(entry.date, entry);
  });

  return allDates.map((date) => {
    const hmtStatsEntry: HMTDailyStats = hmtStatsResultsMap.get(date) || {
      dailyUniqueReceivers: 0,
      dailyUniqueSenders: 0,
      date: date,
      totalTransactionAmount: 0,
      totalTransactionCount: 0,
    };

    const hcaptchaStatsEntry: HcaptchaDailyStats = hcaptchaStatsResultsMap.get(
      date
    ) || {
      date: date,
      solved: 0,
    };

    return { ...hmtStatsEntry, ...hcaptchaStatsEntry };
  });
};

const DEBOUNCE_MS = 300;

const useChartData = (from: dayjs.Dayjs, to: dayjs.Dayjs) => {
  const queryParams = useMemo(
    () => ({
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
    }),
    [from, to]
  );

  const [debouncedQueryParams] = useDebounce(queryParams, DEBOUNCE_MS);

  return useQuery({
    queryFn: async () => {
      const { data: hmtDailyStats } = await httpClient.get(
        apiPaths.hmtDailyStats.path,
        {
          params: debouncedQueryParams,
        }
      );
      const { data: hcaptchDailyStats } = await httpClient.get(
        apiPaths.hcaptchaStatsDaily.path,
        {
          params: debouncedQueryParams,
        }
      );

      const validHmtDailyStats = validateResponse(
        hmtDailyStats,
        hmtDailyStatsSchema
      );

      const validHcaptchaGeneralStats = validateResponse(
        hcaptchDailyStats,
        hcaptchaDailyStatsSchema
      );

      return mergeResponses(
        validHcaptchaGeneralStats.results,
        validHmtDailyStats.results
      );
    },
    staleTime: DEBOUNCE_MS,
    queryKey: ['useChartData', debouncedQueryParams],
    placeholderData: keepPreviousData,
  });
};

export default useChartData;
