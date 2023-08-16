import { ChainId } from '@human-protocol/sdk';
import {
  createAction,
  createAsyncThunk,
  createReducer,
  isAnyOf,
} from '@reduxjs/toolkit';
import {
  UnknownAsyncThunkFulfilledAction,
  UnknownAsyncThunkPendingAction,
  UnknownAsyncThunkRejectedAction,
} from '@reduxjs/toolkit/dist/matchers';
import stringify from 'fast-json-stable-stringify';
import { EventDayData } from './types';
import { RAW_EVENT_DAY_DATA_V2_QUERY } from 'src/queries';
import { AppState } from 'src/state';
import { gqlFetch } from 'src/utils/gqlFetch';

type EventDayDatasType = { [chainId in ChainId]?: EventDayData[] };

type HumanAppDataState = {
  loadingKeys: Record<string, boolean>;
  chainId: ChainId;
  days: number;

  eventDayDatas: EventDayDatasType;
  eventDayDatasLoaded: boolean;
};

const initialState: HumanAppDataState = {
  loadingKeys: {},
  chainId: ChainId.POLYGON_MUMBAI,
  days: 30,
  eventDayDatas: {},
  eventDayDatasLoaded: false,
};

const getEventDayDatas = async (subgraphUrl: string) => {
  return await gqlFetch(subgraphUrl!, RAW_EVENT_DAY_DATA_V2_QUERY)
    .then((res) => res.json())
    .catch((err) => []);
};

export const fetchEventDayDatas = createAsyncThunk<
  EventDayDatasType,
  void,
  { state: AppState }
>('humanAppData/fetchEventDayDatas', async () => {
  const rawData = await getEventDayDatas(
    'https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v2'
  );

  const currentDayId = Math.floor(Date.now() / 1000 / 60 / 60 / 24);
  const eventDayDatas: EventDayData[] = [];

  let j = 0;
  for (let i = currentDayId; i > currentDayId - 365; i--) {
    if (Number(rawData.data.eventDayDatas[j]?.id) === i) {
      eventDayDatas.push(rawData.data.eventDayDatas[j++]);
    } else {
      eventDayDatas.push({
        id: i.toString(),
        timestamp: i * 24 * 60 * 60,
        dailyBulkPayoutEventCount: '0',
        dailyCancelledStatusEventCount: '0',
        dailyCompletedStatusEventCount: '0',
        dailyEscrowAmounts: '0',
        dailyFundEventCount: '0',
        dailyPaidStatusEventCount: '0',
        dailyPartialStatusEventCount: '0',
        dailyPendingStatusEventCount: '0',
        dailySetupEventCount: '0',
        dailyStoreResultsEventCount: '0',
        dailyTotalEventCount: '0',
      });
    }
  }

  return {
    [ChainId.POLYGON_MUMBAI]: eventDayDatas,
  };
});

export const setChainId = createAction<ChainId>('humanAppData/setChainId');

export const setDays = createAction<number>('humanAppData/setDays');

type UnknownAsyncThunkFulfilledOrPendingAction =
  | UnknownAsyncThunkFulfilledAction
  | UnknownAsyncThunkPendingAction
  | UnknownAsyncThunkRejectedAction;

const serializeLoadingKey = (
  action: UnknownAsyncThunkFulfilledOrPendingAction,
  suffix: UnknownAsyncThunkFulfilledOrPendingAction['meta']['requestStatus']
) => {
  const type = action.type.split(`/${suffix}`)[0];
  return stringify({
    arg: action.meta.arg,
    type,
  });
};

export default createReducer(initialState, (builder) => {
  builder.addCase(setChainId, (state, action) => {
    state.chainId = action.payload;
  });
  builder.addCase(setDays, (state, action) => {
    state.days = action.payload;
  });
  builder.addCase(fetchEventDayDatas.fulfilled, (state, action) => {
    state.eventDayDatas = action.payload;
    state.eventDayDatasLoaded = true;
  });

  builder.addMatcher(isAnyOf(fetchEventDayDatas.pending), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'pending')] = true;
  });
  builder.addMatcher(isAnyOf(fetchEventDayDatas.fulfilled), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'fulfilled')] = false;
  });
  builder.addMatcher(isAnyOf(fetchEventDayDatas.rejected), (state, action) => {
    state.loadingKeys[serializeLoadingKey(action, 'rejected')] = false;
  });
});
