import { ethereum } from '@graphprotocol/graph-ts';
import { ONE_DAY } from './number';

export function toEventId(event: ethereum.Event): string {
  return `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;
}

export function toEventDayId(event: ethereum.Event): string {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  return dayStartTimestamp.toString();
}
