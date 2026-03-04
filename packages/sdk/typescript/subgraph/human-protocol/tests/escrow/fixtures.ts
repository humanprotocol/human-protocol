import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as/assembly/index';
import {
  BulkTransfer,
  BulkTransferV2,
  BulkTransferV3,
  CancellationRefund,
  CancellationRequested,
  Cancelled,
  Completed,
  Fund,
  IntermediateStorage,
  Pending,
  PendingV2,
  Withdraw,
} from '../../generated/templates/Escrow/Escrow';
import { generateUniqueHash } from '../../tests/utils';

export function createPendingEvent(
  sender: Address,
  manifest: string,
  hash: string,
  timestamp: BigInt
): Pending {
  const newPendingEvent = changetype<Pending>(newMockEvent());
  newPendingEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
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

export function createPendingV2Event(
  sender: Address,
  manifest: string,
  hash: string,
  reputationOracleAddress: Address,
  recordingOracleAddress: Address,
  exchangeOracleAddress: Address,
  timestamp: BigInt
): PendingV2 {
  const newPendingEvent = changetype<PendingV2>(newMockEvent());
  newPendingEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
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
  hash: string,
  timestamp: BigInt
): IntermediateStorage {
  const newIntermediateStorageEvent =
    changetype<IntermediateStorage>(newMockEvent());
  newIntermediateStorageEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newIntermediateStorageEvent.transaction.nonce
  );

  newIntermediateStorageEvent.transaction.from = sender;

  newIntermediateStorageEvent.parameters = [];

  const urlParam = new ethereum.EventParam(
    'url',
    ethereum.Value.fromString(url)
  );
  const hashParam = new ethereum.EventParam(
    'hash',
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
    'txId',
    ethereum.Value.fromI32(txId)
  );
  const recipientsParam = new ethereum.EventParam(
    'recipients',
    ethereum.Value.fromAddressArray(recipients)
  );
  const amountsParam = new ethereum.EventParam(
    'amounts',
    ethereum.Value.fromI32Array(amounts)
  );
  const isPartialParam = new ethereum.EventParam(
    'isPartial',
    ethereum.Value.fromBoolean(isPartial)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(recipientsParam);
  newBTEvent.parameters.push(amountsParam);
  newBTEvent.parameters.push(isPartialParam);

  return newBTEvent;
}

export function createBulkTransferV2Event(
  sender: Address,
  txId: i32,
  recipients: Address[],
  amounts: i32[],
  isPartial: boolean,
  finalResultsUrl: string,
  timestamp: BigInt
): BulkTransferV2 {
  const newBTEvent = changetype<BulkTransferV2>(newMockEvent());
  newBTEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newBTEvent.transaction.nonce
  );

  newBTEvent.block.timestamp = timestamp;
  newBTEvent.transaction.from = sender;

  newBTEvent.parameters = [];

  const txIdParam = new ethereum.EventParam(
    'txId',
    ethereum.Value.fromI32(txId)
  );
  const recipientsParam = new ethereum.EventParam(
    'recipients',
    ethereum.Value.fromAddressArray(recipients)
  );
  const amountsParam = new ethereum.EventParam(
    'amounts',
    ethereum.Value.fromI32Array(amounts)
  );
  const isPartialParam = new ethereum.EventParam(
    'isPartial',
    ethereum.Value.fromBoolean(isPartial)
  );
  const finalResultsUrlParam = new ethereum.EventParam(
    'finalResultsUrl',
    ethereum.Value.fromString(finalResultsUrl)
  );

  newBTEvent.parameters.push(txIdParam);
  newBTEvent.parameters.push(recipientsParam);
  newBTEvent.parameters.push(amountsParam);
  newBTEvent.parameters.push(isPartialParam);
  newBTEvent.parameters.push(finalResultsUrlParam);

  return newBTEvent;
}

export function createBulkTransferV3Event(
  sender: Address,
  payoutId: Bytes,
  recipients: Address[],
  amounts: i32[],
  isPartial: boolean,
  finalResultsUrl: string,
  finalResultsHash: string,
  timestamp: BigInt
): BulkTransferV3 {
  const newBTEvent = changetype<BulkTransferV3>(newMockEvent());
  newBTEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newBTEvent.transaction.nonce
  );

  newBTEvent.block.timestamp = timestamp;
  newBTEvent.transaction.from = sender;

  newBTEvent.parameters = [];

  const payoutIdParam = new ethereum.EventParam(
    'payoutId',
    ethereum.Value.fromBytes(payoutId)
  );
  const recipientsParam = new ethereum.EventParam(
    'recipients',
    ethereum.Value.fromAddressArray(recipients)
  );
  const amountsParam = new ethereum.EventParam(
    'amounts',
    ethereum.Value.fromI32Array(amounts)
  );
  const isPartialParam = new ethereum.EventParam(
    'isPartial',
    ethereum.Value.fromBoolean(isPartial)
  );
  const finalResultsUrlParam = new ethereum.EventParam(
    'finalResultsUrl',
    ethereum.Value.fromString(finalResultsUrl)
  );
  const finalResultsHashParam = new ethereum.EventParam(
    'finalResultsHash',
    ethereum.Value.fromString(finalResultsHash)
  );

  newBTEvent.parameters.push(payoutIdParam);
  newBTEvent.parameters.push(recipientsParam);
  newBTEvent.parameters.push(amountsParam);
  newBTEvent.parameters.push(isPartialParam);
  newBTEvent.parameters.push(finalResultsUrlParam);
  newBTEvent.parameters.push(finalResultsHashParam);

  return newBTEvent;
}

export function createCancelledEvent(sender: Address): Cancelled {
  const newCancelledEvent = changetype<Cancelled>(newMockEvent());
  newCancelledEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    newCancelledEvent.transaction.nonce,
    newCancelledEvent.transaction.nonce
  );

  newCancelledEvent.transaction.from = sender;

  newCancelledEvent.parameters = [];

  return newCancelledEvent;
}

export function createCompletedEvent(
  sender: Address,
  timestamp: BigInt
): Completed {
  const newCompletedEvent = changetype<Completed>(newMockEvent());
  newCompletedEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newCompletedEvent.transaction.nonce
  );

  newCompletedEvent.transaction.from = sender;

  newCompletedEvent.parameters = [];

  return newCompletedEvent;
}

export function createFundEvent(
  sender: Address,
  amount: i32,
  timestamp: BigInt
): Fund {
  const newFundEvent = changetype<Fund>(newMockEvent());
  newFundEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newFundEvent.transaction.nonce
  );

  newFundEvent.block.timestamp = timestamp;

  newFundEvent.transaction.from = sender;

  newFundEvent.parameters = [];

  const amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromI32(amount)
  );

  newFundEvent.parameters.push(amountParam);

  return newFundEvent;
}

export function createWithdrawEvent(
  sender: Address,
  token: Address,
  amount: i32,
  timestamp: BigInt
): Withdraw {
  const newWithdrawEvent = changetype<Withdraw>(newMockEvent());
  newWithdrawEvent.transaction.hash = generateUniqueHash(
    sender.toString() + token.toString(),
    timestamp,
    newWithdrawEvent.transaction.nonce
  );

  newWithdrawEvent.block.timestamp = timestamp;

  newWithdrawEvent.transaction.from = sender;

  newWithdrawEvent.parameters = [];

  const tokenParam = new ethereum.EventParam(
    'token',
    ethereum.Value.fromAddress(token)
  );

  const amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromI32(amount)
  );

  newWithdrawEvent.parameters.push(tokenParam);
  newWithdrawEvent.parameters.push(amountParam);

  return newWithdrawEvent;
}

export function createCancellationRequestedEvent(
  sender: Address,
  timestamp: BigInt
): CancellationRequested {
  const event = changetype<CancellationRequested>(newMockEvent());
  event.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    event.transaction.nonce
  );
  event.transaction.from = sender;
  event.parameters = [];
  return event;
}

export function createCancellationRefundEvent(
  escrowAddress: Address,
  sender: Address,
  amount: i32,
  timestamp: BigInt
): CancellationRefund {
  const event = changetype<CancellationRefund>(newMockEvent());
  event.address = escrowAddress;
  event.transaction.from = sender;
  event.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    event.transaction.nonce
  );

  event.parameters = [];

  const amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromI32(amount)
  );

  event.parameters.push(amountParam);
  return event;
}
