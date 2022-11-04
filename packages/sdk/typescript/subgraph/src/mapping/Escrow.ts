import {
  BulkTransfer,
  IntermediateStorage,
  Pending,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkTransferEvent,
  EscrowStatistics,
  ISEvent,
  PEvent,
} from '../../generated/schema';
import { BigInt } from '@graphprotocol/graph-ts';
import {
  updateIntermediateStorageEventDayData,
  updatePendingEventDayData,
  updateBulkTransferEventDayData,
} from './utils/dayUpdates';

export const STATISTICS_ENTITY_ID = 'escrow-statistics-id';

export function constructStatsEntity(): EscrowStatistics {
  const entity = new EscrowStatistics(STATISTICS_ENTITY_ID);

  entity.intermediateStorageEventCount = BigInt.fromI32(0);
  entity.pendingEventCount = BigInt.fromI32(0);
  entity.bulkTransferEventCount = BigInt.fromI32(0);
  entity.totalEventCount = BigInt.fromI32(0);
  entity.totalEscrowCount = BigInt.fromI32(0);

  return entity;
}

export function handleIntermediateStorage(event: IntermediateStorage): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new ISEvent(id);

  // Entity fields can be set based on event parameters
  entity.timestamp = event.block.timestamp;
  entity._url = event.params._url;
  entity._hash = event.params._hash;

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }
  entity.count = statsEntity.intermediateStorageEventCount + BigInt.fromI32(1);
  statsEntity.intermediateStorageEventCount += BigInt.fromI32(1);
  statsEntity.totalEventCount += BigInt.fromI32(1);

  statsEntity.save();
  entity.save();

  updateIntermediateStorageEventDayData(event);
}

export function handlePending(event: Pending): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new PEvent(id);

  // Entity fields can be set based on event parameters
  entity._url = event.params.manifest;
  entity._hash = event.params.hash;
  entity.timestamp = event.block.timestamp;

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  entity.count = statsEntity.pendingEventCount + BigInt.fromI32(1);

  statsEntity.pendingEventCount += BigInt.fromI32(1);

  statsEntity.totalEventCount += BigInt.fromI32(1);

  entity.save();
  statsEntity.save();

  updatePendingEventDayData(event);
}

export function handleBulkTransfer(event: BulkTransfer): void {
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new BulkTransferEvent(id);

  entity.escrow = event.address;
  entity.bulkCount = event.params._bulkCount;
  entity.txId = event.params._txId;
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }
  entity.count = statsEntity.bulkTransferEventCount + BigInt.fromI32(1);
  statsEntity.bulkTransferEventCount += BigInt.fromI32(1);
  statsEntity.totalEventCount += BigInt.fromI32(1);

  statsEntity.save();
  entity.save();

  updateBulkTransferEventDayData(event);
}
