import {
  BulkTransfer,
  IntermediateStorage,
  Pending,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkTransferEvent,
  EscrowStatistics,
  ISEvent,
  LaunchedEscrow,
  PEvent,
} from '../../generated/schema';
import { BigInt, dataSource } from '@graphprotocol/graph-ts';
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
  statsEntity.intermediateStorageEventCount =
    statsEntity.intermediateStorageEventCount.plus(BigInt.fromI32(1));
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    BigInt.fromI32(1)
  );
  entity.count = statsEntity.intermediateStorageEventCount;

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

  statsEntity.pendingEventCount = statsEntity.pendingEventCount.plus(
    BigInt.fromI32(1)
  );
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    BigInt.fromI32(1)
  );

  entity.count = statsEntity.pendingEventCount;

  entity.save();
  statsEntity.save();

  updatePendingEventDayData(event);

  // Update escrow entity
  const escrowEntity = LaunchedEscrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Pending';
    escrowEntity.save();
  }
}

export function handleBulkTransfer(event: BulkTransfer): void {
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new BulkTransferEvent(id);

  entity.escrow = event.address;
  entity.bulkCount = event.params._bulkCount;
  entity.txId = event.params._txId;
  entity.amountPaid = event.params._amountPaid;
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }
  statsEntity.bulkTransferEventCount = statsEntity.bulkTransferEventCount.plus(
    BigInt.fromI32(1)
  );
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    BigInt.fromI32(1)
  );
  entity.count = statsEntity.bulkTransferEventCount;

  statsEntity.save();
  entity.save();

  updateBulkTransferEventDayData(event);

  // Update escrow entity
  const escrowEntity = LaunchedEscrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = event.params._isPartial ? 'Partially Paid' : 'Paid';
    escrowEntity.amountPayout = escrowEntity.amountPayout.plus(
      event.params._amountPaid
    );
    escrowEntity.save();
  }
}

export function handleCancelled(): void {
  const escrowEntity = LaunchedEscrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Cancelled';
    escrowEntity.save();
  }
}

export function handleCompleted(): void {
  const escrowEntity = LaunchedEscrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Completed';
    escrowEntity.save();
  }
}
