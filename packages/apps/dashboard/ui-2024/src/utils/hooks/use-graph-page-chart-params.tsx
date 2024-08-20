import dayjs, { Dayjs } from 'dayjs';
import { create } from 'zustand';

export type GraphPageChartPeriodName = '1W' | '1M' | '6M' | '1Y' | 'ALL';

export type TimePeriod = {
	value: Dayjs;
	name: GraphPageChartPeriodName;
};

const oneWeekAgo = dayjs().subtract(1, 'week');
const oneMonthAgo = dayjs().subtract(1, 'month');
const sixMonthsAgo = dayjs().subtract(6, 'months');
const oneYearAgo = dayjs().subtract(1, 'year');
export const initialAllTime = dayjs().subtract(10, 'years');

export const TIME_PERIOD_OPTIONS: TimePeriod[] = [
	{
		value: oneWeekAgo,
		name: '1W',
	},
	{
		value: oneMonthAgo,
		name: '1M',
	},
	{
		value: sixMonthsAgo,
		name: '6M',
	},
	{
		value: oneYearAgo,
		name: '1Y',
	},
	{
		value: initialAllTime,
		name: 'ALL',
	},
];

export interface GraphPageChartParams {
	dateRangeParams: {
		from: Dayjs;
		to: Dayjs;
	};
	effectiveFromAllTimeDate?: Dayjs;
	selectedTimePeriod: GraphPageChartPeriodName | null;
	setTimePeriod: (timePeriod: TimePeriod) => void;
	clearTimePeriod: () => void;
	setFromDate: (fromDate: Dayjs | null) => void;
	setToDate: (toDate: Dayjs | null) => void;
	setEffectiveFromAllTimeDate: (date: Dayjs) => void;
}

export const useGraphPageChartParams = create<GraphPageChartParams>((set) => ({
	dateRangeParams: {
		from: oneWeekAgo,
		to: dayjs(),
	},
	effectiveFromAllTimeDate: undefined,
	selectedTimePeriod: '1W',
	setFromDate: (fromDate: Dayjs | null) => {
		if (!fromDate) {
			return;
		}
		set((state) => {
			return {
				...state,
				dateRangeParams: {
					...state.dateRangeParams,
					from: fromDate,
				},
			};
		});
	},
	setToDate: (toDate: Dayjs | null) => {
		if (!toDate) {
			return null;
		}
		set((state) => ({
			...state,
			dateRangeParams: {
				...state.dateRangeParams,
				to: toDate,
			},
		}));
	},
	setTimePeriod: (timePeriod: TimePeriod) => {
		set((state) => {
			const newFromDate =
				state.effectiveFromAllTimeDate && timePeriod.name === 'ALL'
					? state.effectiveFromAllTimeDate
					: timePeriod.value;

			return {
				...state,
				selectedTimePeriod: timePeriod.name,
				dateRangeParams: {
					...state.dateRangeParams,
					from: newFromDate,
				},
			};
		});
	},
	clearTimePeriod: () => {
		set((state) => ({ ...state, selectedTimePeriod: null }));
	},
	setEffectiveFromAllTimeDate: (date: Dayjs) => {
		set((state) => ({
			...state,
			effectiveFromAllTimeDate: date,
		}));
	},
}));
