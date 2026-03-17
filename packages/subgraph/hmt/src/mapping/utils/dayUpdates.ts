import { Bytes, ethereum } from '@graphprotocol/graph-ts';
import { EventDayData } from '../../../generated/schema';
import { ONE_DAY, ZERO_BI } from './number';

export function getEventDayData(event: ethereum.Event): EventDayData {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  const id = Bytes.fromI32(dayID);
  let eventDayData = EventDayData.load(id);

  if (eventDayData == null) {
    eventDayData = new EventDayData(id);
    eventDayData.timestamp = dayStartTimestamp;
    eventDayData.dailyHMTTransferCount = ZERO_BI;
    eventDayData.dailyHMTTransferAmount = ZERO_BI;
    eventDayData.dailyUniqueSenders = ZERO_BI;
    eventDayData.dailyUniqueReceivers = ZERO_BI;
    eventDayData.save();
  }

  return eventDayData;
}
