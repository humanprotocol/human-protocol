import { ethereum } from '@graphprotocol/graph-ts';
import { Launched } from '../../../generated/EscrowFactory/EscrowFactory';
import { EventDayData } from '../../../generated/schema';
import {
  IntermediateStorage,
  Pending,
  BulkTransfer,
} from '../../../generated/templates/Escrow/Escrow';
import { ZERO_BI, ONE_BI, ONE_DAY } from './number';

function getEventDayData(event: ethereum.Event): EventDayData {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  let eventDayData = EventDayData.load(dayID.toString());
  if (eventDayData === null) {
    eventDayData = new EventDayData(dayID.toString());
    eventDayData.timestamp = dayStartTimestamp;
    eventDayData.dailyBulkTransferEvents = ZERO_BI;
    eventDayData.dailyIntermediateStorageEvents = ZERO_BI;
    eventDayData.dailyPendingEvents = ZERO_BI;
    eventDayData.dailyEscrowAmounts = ZERO_BI;
  }
  return eventDayData;
}

export function updateIntermediateStorageEventDayData(
  event: IntermediateStorage
): EventDayData {
  const eventDayData = getEventDayData(event);

  eventDayData.dailyIntermediateStorageEvents =
    eventDayData.dailyIntermediateStorageEvents.plus(ONE_BI);
  eventDayData.save();

  return eventDayData;
}

export function updatePendingEventDayData(event: Pending): EventDayData {
  const eventDayData = getEventDayData(event);

  eventDayData.dailyPendingEvents =
    eventDayData.dailyPendingEvents.plus(ONE_BI);
  eventDayData.save();

  return eventDayData;
}

export function updateBulkTransferEventDayData(
  event: BulkTransfer
): EventDayData {
  const eventDayData = getEventDayData(event);

  eventDayData.dailyBulkTransferEvents =
    eventDayData.dailyBulkTransferEvents.plus(ONE_BI);
  eventDayData.save();

  return eventDayData;
}

export function updateEscrowAmountDayData(event: Launched): EventDayData {
  const eventDayData = getEventDayData(event);

  eventDayData.dailyEscrowAmounts =
    eventDayData.dailyEscrowAmounts.plus(ONE_BI);
  eventDayData.save();

  return eventDayData;
}
