import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { z } from 'zod';
import { httpService } from '../http-service';
import { apiPaths } from '../api-paths';
import { validateResponse } from '@services/validate-response';
import { useGraphPageChartParams } from '@utils/hooks/use-graph-page-chart-params';
import { useDebounce } from 'use-debounce';
import { useMemo } from 'react';
import dayjs from 'dayjs';

const hmtDailyStatSchemaResponseSchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
	results: z.array(
		z.object({
			totalTransactionAmount: z.string().transform((value, ctx) => {
				const valueAsNumber = Number(value);
				if (Number.isNaN(valueAsNumber)) {
					ctx.addIssue({
						path: ['totalTransactionAmount'],
						code: z.ZodIssueCode.custom,
					});
				}

				return valueAsNumber / 10 ** 18;
			}),
			totalTransactionCount: z.number(),
			dailyUniqueSenders: z.number(),
			dailyUniqueReceivers: z.number(),
			date: z.string(),
		})
	),
});

export type HMTDailyStatsResponse = z.output<
	typeof hmtDailyStatSchemaResponseSchema
>;
export type HMTDailyStat = HMTDailyStatsResponse['results'][number];

const hcaptchaDailyStatsResponseSchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
	results: z.array(
		z.object({
			solved: z.number(),
			date: z.string(),
		})
	),
});

export type HcaptchaDailyStatsResponse = z.infer<
	typeof hcaptchaDailyStatsResponseSchema
>;
export type HcaptchaDailyStat = HcaptchaDailyStatsResponse['results'][number];

export type GraphPageChartData = (HMTDailyStat &
	Omit<HcaptchaDailyStat, 'date'>)[];

const mergeResponses = (
	hcaptchaStatsResults: HcaptchaDailyStat[],
	hmtStatsResults: HMTDailyStat[]
): GraphPageChartData => {
	const allDates = Array.from(
		new Set([
			...hcaptchaStatsResults.map(({ date }) => date),
			...hmtStatsResults.map(({ date }) => date),
		])
	).sort((a, b) => (dayjs(a).isBefore(dayjs(b)) ? -1 : 1));

	const hcaptchaStatsResultsMap = new Map<string, HcaptchaDailyStat>();
	const hmtStatsResultsMap = new Map<string, HMTDailyStat>();

	hcaptchaStatsResults.forEach((entry) => {
		hcaptchaStatsResultsMap.set(entry.date, entry);
	});

	hmtStatsResults.forEach((entry) => {
		hmtStatsResultsMap.set(entry.date, entry);
	});
	return allDates.map((date) => {
		const hmtStatsEntry: HMTDailyStat = hmtStatsResultsMap.get(date) || {
			dailyUniqueReceivers: 0,
			dailyUniqueSenders: 0,
			date: date,
			totalTransactionAmount: 0,
			totalTransactionCount: 0,
		};

		const hcaptchaStatsEntry: HcaptchaDailyStat = hcaptchaStatsResultsMap.get(
			date
		) || {
			date: date,
			solved: 0,
		};
		return { ...hmtStatsEntry, ...hcaptchaStatsEntry };
	});
};

const DEBOUNCE_MS = 300;

export function useGraphPageChartData() {
	const {
		dateRangeParams,
		selectedTimePeriod,
		effectiveFromAllTimeDate,
		setEffectiveFromAllTimeDate,
		setFromDate,
	} = useGraphPageChartParams();
	const queryParams = useMemo(
		() => ({
			from: dateRangeParams.from.format('YYYY-MM-DD'),
			to: dateRangeParams.to.format('YYYY-MM-DD'),
		}),
		[dateRangeParams.from, dateRangeParams.to]
	);

	const [debouncedQueryParams] = useDebounce(queryParams, DEBOUNCE_MS);

	return useQuery({
		queryFn: async () => {
			const { data: hmtDailyStats } = await httpService.get(
				apiPaths.hmtDailyStats.path,
				{
					params: debouncedQueryParams,
				}
			);
			const { data: hcaptchDailyStats } = await httpService.get(
				apiPaths.hcaptchaStatsDaily.path,
				{
					params: debouncedQueryParams,
				}
			);

			const validHmtDailyStats = validateResponse(
				hmtDailyStats,
				hmtDailyStatSchemaResponseSchema
			);

			const validHcaptchaGeneralStats = validateResponse(
				hcaptchDailyStats,
				hcaptchaDailyStatsResponseSchema
			);

			const mergedResponses = mergeResponses(
				validHcaptchaGeneralStats.results,
				validHmtDailyStats.results
			);
			const latestDate = mergedResponses[0]?.date
				? dayjs(new Date(mergedResponses[0]?.date))
				: null;

			const fromDateInLatestDateFormat = dayjs(
				new Date(dateRangeParams.from.format('YYYY-MM-DD'))
			);

			if (
				(selectedTimePeriod === 'ALL' &&
					!effectiveFromAllTimeDate &&
					latestDate) ||
				(!effectiveFromAllTimeDate &&
					latestDate?.isAfter(fromDateInLatestDateFormat))
			) {
				console.log({ fromDateInLatestDateFormat, latestDate });
				setEffectiveFromAllTimeDate(latestDate);
				setFromDate(latestDate);
			}

			return mergedResponses;
		},
		staleTime: DEBOUNCE_MS,
		queryKey: ['useGraphPageChartData', debouncedQueryParams],
		placeholderData: keepPreviousData,
	});
}
