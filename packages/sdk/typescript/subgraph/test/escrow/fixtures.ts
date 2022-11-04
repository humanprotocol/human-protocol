import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt } from '@graphprotocol/graph-ts';

import {
  IntermediateStorage,
  Pending,
  BulkTransfer,
} from '../../generated/templates/Escrow/Escrow';

export function createISEvent(url: string, hash: string): IntermediateStorage {
  const newIntermediateStorageEvent = changetype<IntermediateStorage>(
    newMockEvent()
  );
  newIntermediateStorageEvent.parameters = [];
  const urlParam = new ethereum.EventParam(
    '_url',
    ethereum.Value.fromString(url)
  );
  const hashParam = new ethereum.EventParam(
    '_hash',
    ethereum.Value.fromString(hash)
  );

  newIntermediateStorageEvent.parameters.push(urlParam);
  newIntermediateStorageEvent.parameters.push(hashParam);

  return newIntermediateStorageEvent;
}

export function createPendingEvent(manifest: string, hash: string): Pending {
  const newPendingEvent = changetype<Pending>(newMockEvent());
  newPendingEvent.parameters = [];
  const manifestParam = new ethereum.EventParam(
    'manifest',
    ethereum.Value.fromString(manifest)
  );
  const hashParam = new ethereum.EventParam(
    'hash',
    ethereum.Value.fromString(hash)
  );

  newPendingEvent.parameters.push(manifestParam);
  newPendingEvent.parameters.push(hashParam);

  return newPendingEvent;
}

export function createBulkTransferEvent(
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkTransfer {
  const newBTEvent = changetype<BulkTransfer>(newMockEvent());
  newBTEvent.parameters = [];
  newBTEvent.block.timestamp = timestamp;
  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const bulkCountParam = new ethereum.EventParam(
    'hash',
    ethereum.Value.fromI32(bulkCount)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(bulkCountParam);

  return newBTEvent;
}
