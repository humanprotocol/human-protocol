import dayjs, { Dayjs } from 'dayjs';
import { create } from 'zustand';

const MINIMAL_DATE_FOR_DATE_PICKER = '2021-04-06';

export type GraphPageChartPeriodName = '24H' | '1W' | '2W' | '1M' | 'ALL';

export type TimePeriod = {
  value: Dayjs;
  name: GraphPageChartPeriodName;
};

const oneDayAgo = dayjs().subtract(1, 'day');
const oneWeekAgo = dayjs().subtract(1, 'week');
const twoWeeksAgo = dayjs().subtract(2, 'weeks');
const oneMonthAgo = dayjs().subtract(1, 'month');
export const initialAllTime = dayjs(MINIMAL_DATE_FOR_DATE_PICKER);

export const TIME_PERIOD_OPTIONS: TimePeriod[] = [
  {
    value: oneDayAgo,
    name: '24H',
  },
  {
    value: oneWeekAgo,
    name: '1W',
  },
  {
    value: twoWeeksAgo,
    name: '2W',
  },
  {
    value: oneMonthAgo,
    name: '1M',
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
  selectedTimePeriod: GraphPageChartPeriodName | null;
  setTimePeriod: (timePeriod: TimePeriod) => void;
  clearTimePeriod: () => void;
  setFromDate: (fromDate: Dayjs | null) => void;
  setToDate: (toDate: Dayjs | null) => void;
  setEffectiveFromAllTimeDate: (date: Dayjs) => void;
  revertToInitialParams: () => void;
}

const INITIAL_RANGE_PARAMS = {
  from: oneWeekAgo,
  to: dayjs(),
};

export const useGraphPageChartParams = create<GraphPageChartParams>((set) => ({
  dateRangeParams: INITIAL_RANGE_PARAMS,
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
      return {
        ...state,
        selectedTimePeriod: timePeriod.name,
        dateRangeParams: {
          ...state.dateRangeParams,
          from: timePeriod.value,
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
  revertToInitialParams: () => {
    set((state) => ({
      ...state,
      dateRangeParams: INITIAL_RANGE_PARAMS,
    }));
  },
}));
