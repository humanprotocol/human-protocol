import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';

import {
  IntermediateStorage,
  Pending,
  BulkTransfer,
} from '../../../generated/templates/LegacyEscrow/Escrow';
import { generateUniqueHash } from '../../../tests/utils';

export function createPendingEvent(
  sender: Address,
  manifest: string,
  hash: string
): Pending {
  const newPendingEvent = changetype<Pending>(newMockEvent());
  newPendingEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    newPendingEvent.transaction.nonce,
    newPendingEvent.transaction.nonce
  );

  newPendingEvent.transaction.from = sender;

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

export function createISEvent(
  sender: Address,
  url: string,
  hash: string
): IntermediateStorage {
  const newIntermediateStorageEvent =
    changetype<IntermediateStorage>(newMockEvent());
  newIntermediateStorageEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    newIntermediateStorageEvent.transaction.nonce,
    newIntermediateStorageEvent.transaction.nonce
  );

  newIntermediateStorageEvent.transaction.from = sender;

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

export function createBulkTransferEvent(
  sender: Address,
  txId: i32,
  bulkCount: i32,
  timestamp: BigInt
): BulkTransfer {
  const newBTEvent = changetype<BulkTransfer>(newMockEvent());
  newBTEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newBTEvent.transaction.nonce
  );

  newBTEvent.block.timestamp = timestamp;
  newBTEvent.transaction.from = sender;

  newBTEvent.parameters = [];

  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const bulkCountParam = new ethereum.EventParam(
    '_bulkCount',
    ethereum.Value.fromI32(bulkCount)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(bulkCountParam);

  return newBTEvent;
}
