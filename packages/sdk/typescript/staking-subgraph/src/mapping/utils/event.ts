import { Bytes, ethereum } from '@graphprotocol/graph-ts';

export function toEventId(event: ethereum.Event): Bytes {
  return event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concatI32(event.block.timestamp.toI32());
}
