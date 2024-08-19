import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';

import {
  IntermediateStorage,
  Pending,
  BulkTransfer,
  Cancelled,
  Completed,
} from '../../generated/templates/Escrow/Escrow';

export function createPendingEvent(
  sender: Address,
  manifest: string,
  hash: string,
  reputationOracleAddress: Address,
  recordingOracleAddress: Address,
  exchangeOracleAddress: Address
): Pending {
  const newPendingEvent = changetype<Pending>(newMockEvent());

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
  const reputationOracleAddressParam = new ethereum.EventParam(
    'reputationOracleAddress',
    ethereum.Value.fromAddress(reputationOracleAddress)
  );
  const recordingOracleAddressParam = new ethereum.EventParam(
    'recordingOracleAddress',
    ethereum.Value.fromAddress(recordingOracleAddress)
  );
  const exchangeOracleAddressParam = new ethereum.EventParam(
    'exchangeOracleAddress',
    ethereum.Value.fromAddress(exchangeOracleAddress)
  );

  newPendingEvent.parameters.push(manifestParam);
  newPendingEvent.parameters.push(hashParam);
  newPendingEvent.parameters.push(reputationOracleAddressParam);
  newPendingEvent.parameters.push(recordingOracleAddressParam);
  newPendingEvent.parameters.push(exchangeOracleAddressParam);

  return newPendingEvent;
}

export function createISEvent(
  sender: Address,
  url: string,
  hash: string
): IntermediateStorage {
  const newIntermediateStorageEvent =
    changetype<IntermediateStorage>(newMockEvent());

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
  recipients: Address[],
  amounts: i32[],
  isPartial: boolean,
  finalResultsUrl: string,
  timestamp: BigInt
): BulkTransfer {
  const newBTEvent = changetype<BulkTransfer>(newMockEvent());

  newBTEvent.block.timestamp = timestamp;
  newBTEvent.transaction.from = sender;

  newBTEvent.parameters = [];

  const txIdParam = new ethereum.EventParam(
    '_txId',
    ethereum.Value.fromI32(txId)
  );
  const recipientsParam = new ethereum.EventParam(
    '_recipients',
    ethereum.Value.fromAddressArray(recipients)
  );
  const amountsParam = new ethereum.EventParam(
    '_amounts',
    ethereum.Value.fromI32Array(amounts)
  );
  const isPartialParam = new ethereum.EventParam(
    '_isPartial',
    ethereum.Value.fromBoolean(isPartial)
  );
  const finalResultsUrlParam = new ethereum.EventParam(
    '_finalResultsUrl',
    ethereum.Value.fromString(finalResultsUrl)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(recipientsParam);
  newBTEvent.parameters.push(amountsParam);
  newBTEvent.parameters.push(isPartialParam);
  newBTEvent.parameters.push(finalResultsUrlParam);

  return newBTEvent;
}

export function createCancelledEvent(sender: Address): Cancelled {
  const newCancelledEvent = changetype<Cancelled>(newMockEvent());

  newCancelledEvent.transaction.from = sender;

  newCancelledEvent.parameters = [];

  return newCancelledEvent;
}

export function createCompletedEvent(sender: Address): Completed {
  const newCompletedEvent = changetype<Completed>(newMockEvent());

  newCompletedEvent.transaction.from = sender;

  newCompletedEvent.parameters = [];

  return newCompletedEvent;
}
