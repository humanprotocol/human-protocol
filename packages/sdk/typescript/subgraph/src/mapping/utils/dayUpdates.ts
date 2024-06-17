import { ethereum } from '@graphprotocol/graph-ts';
import { EventDayData } from '../../../generated/schema';
import { ZERO_BI, ONE_DAY } from './number';

export function getEventDayData(event: ethereum.Event): EventDayData {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  let eventDayData = EventDayData.load(dayID.toString());
  if (eventDayData === null) {
    eventDayData = new EventDayData(dayID.toString());
    eventDayData.timestamp = dayStartTimestamp;
    eventDayData.dailyFundEventCount = ZERO_BI;
    eventDayData.dailySetupEventCount = ZERO_BI;
    eventDayData.dailyStoreResultsEventCount = ZERO_BI;
    eventDayData.dailyBulkPayoutEventCount = ZERO_BI;
    eventDayData.dailyPendingStatusEventCount = ZERO_BI;
    eventDayData.dailyCancelledStatusEventCount = ZERO_BI;
    eventDayData.dailyPartialStatusEventCount = ZERO_BI;
    eventDayData.dailyPaidStatusEventCount = ZERO_BI;
    eventDayData.dailyCompletedStatusEventCount = ZERO_BI;
    eventDayData.dailyTotalEventCount = ZERO_BI;
    eventDayData.dailyEscrowCount = ZERO_BI;
    eventDayData.dailyWorkerCount = ZERO_BI;
    eventDayData.dailyPayoutCount = ZERO_BI;
    eventDayData.dailyPayoutAmount = ZERO_BI;
    eventDayData.dailyHMTTransferCount = ZERO_BI;
    eventDayData.dailyHMTTransferAmount = ZERO_BI;
    eventDayData.dailyUniqueSenders = ZERO_BI;
    eventDayData.dailyUniqueReceivers = ZERO_BI;
  }
  return eventDayData;
}
