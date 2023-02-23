import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt } from '@graphprotocol/graph-ts';

import {
  IntermediateStorage,
  Pending,
  BulkTransfer,
} from '../../generated/templates/Escrow/Escrow';

export function createISEvent(
  sender: string,
  url: string,
  hash: string
): IntermediateStorage {
  const newIntermediateStorageEvent = changetype<IntermediateStorage>(
    newMockEvent()
  );
  newIntermediateStorageEvent.parameters = [];
  const senderParam = new ethereum.EventParam(
    '_sender',
    ethereum.Value.fromString(sender)
  );
  const urlParam = new ethereum.EventParam(
    '_url',
    ethereum.Value.fromString(url)
  );
  const hashParam = new ethereum.EventParam(
    '_hash',
    ethereum.Value.fromString(hash)
  );

  newIntermediateStorageEvent.parameters.push(senderParam);
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
  recipients: string[],
  amounts: i32[],
  isPartial: boolean,
  timestamp: BigInt
): BulkTransfer {
  const newBTEvent = changetype<BulkTransfer>(newMockEvent());
  newBTEvent.parameters = [];
  newBTEvent.block.timestamp = timestamp;
  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const recipientsParam = new ethereum.EventParam(
    '_recipients',
    ethereum.Value.fromStringArray(recipients)
  );
  const amountsParam = new ethereum.EventParam(
    '_amounts',
    ethereum.Value.fromI32Array(amounts)
  );
  const isPartialParam = new ethereum.EventParam(
    '_isPartial',
    ethereum.Value.fromBoolean(isPartial)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(recipientsParam);
  newBTEvent.parameters.push(amountsParam);
  newBTEvent.parameters.push(isPartialParam);

  return newBTEvent;
}
