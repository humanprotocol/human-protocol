import { ethereum } from '@graphprotocol/graph-ts';

export function toEventId(event: ethereum.Event): string {
  return `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;
}
