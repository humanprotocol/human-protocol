import { BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { ONE_DAY } from './number';

export function toEventId(event: ethereum.Event): Bytes {
  return event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concatI32(event.block.timestamp.toI32());
}

export function toEventDayId(event: ethereum.Event): BigInt {
  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  return BigInt.fromI32(dayStartTimestamp);
}
