import {
  BulkTransfer,
  Cancelled,
  Completed,
  IntermediateStorage,
  Pending,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkPayoutEvent,
  CancelledStatusEvent,
  CompletedStatusEvent,
  Escrow,
  EscrowStatistics,
  PaidStatusEvent,
  PartialStatusEvent,
  Payout,
  PendingStatusEvent,
  SetupEvent,
  StoreResultsEvent,
  Worker,
} from '../../generated/schema';
import { Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import {
  updateIntermediateStorageEventDayData,
  updatePendingEventDayData,
  updateBulkTransferEventDayData,
} from './utils/dayUpdates';
import { ZERO_BI, ONE_BI } from './utils/number';
import { toEventId } from './utils/event';

export const STATISTICS_ENTITY_ID = 'escrow-statistics-id';

function constructStatsEntity(): EscrowStatistics {
  const entity = new EscrowStatistics(STATISTICS_ENTITY_ID);

  entity.intermediateStorageEventCount = ZERO_BI;
  entity.pendingEventCount = ZERO_BI;
  entity.bulkTransferEventCount = ZERO_BI;
  entity.totalEventCount = ZERO_BI;
  entity.totalEscrowCount = ZERO_BI;

  return entity;
}

export function createOrLoadEscrowStatistics(): EscrowStatistics {
  let statsEntity = EscrowStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  return statsEntity;
}

export function createOrLoadWorker(address: Address): Worker {
  let worker = Worker.load(address.toHex());

  if (!worker) {
    worker = new Worker(address.toHex());
    worker.address = address;
    worker.totalAmountReceived = ZERO_BI;
    worker.payoutCount = ZERO_BI;
  }

  return worker;
}

export function handlePending(event: Pending): void {
  // Create SetupEvent entity
  const setupEventEntity = new SetupEvent(toEventId(event));
  setupEventEntity.block = event.block.number;
  setupEventEntity.timestamp = event.block.timestamp;
  setupEventEntity.txHash = event.transaction.hash;
  setupEventEntity.escrowAddress = event.address;
  setupEventEntity.sender = event.transaction.from;
  setupEventEntity.save();

  // Create PendingStatusEvent entity
  const statusEventEntity = new PendingStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.save();

  // Updates escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.pendingEventCount = statsEntity.pendingEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

  statsEntity.save();

  // Update event day data
  updatePendingEventDayData(event);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.manifestUrl = event.params.manifest;
    escrowEntity.manifestHash = event.params.hash;
    escrowEntity.status = 'Pending';
    escrowEntity.save();
  }
}

export function handleIntermediateStorage(event: IntermediateStorage): void {
  // Create StoreResultsEvent entity
  const eventEntity = new StoreResultsEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.intermediateResultsUrl = event.params._url;
  eventEntity.save();

  // Updates escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.intermediateStorageEventCount =
    statsEntity.intermediateStorageEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  updateIntermediateStorageEventDayData(event);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.intermediateResultsUrl = event.params._url;
    escrowEntity.save();
  }
}

export function handleBulkTransfer(event: BulkTransfer): void {
  // Create BulkPayoutEvent entity
  const eventEntity = new BulkPayoutEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.bulkPayoutTxId = event.params._txId;
  eventEntity.bulkCount = BigInt.fromI32(event.params._recipients.length);
  eventEntity.save();

  // Update escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.bulkTransferEventCount =
    statsEntity.bulkTransferEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  updateBulkTransferEventDayData(event);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = event.params._isPartial ? 'Partially Paid' : 'Paid';
    const totalAmountPaid = event.params._amounts.reduce(
      (a, b) => a.plus(b),
      ZERO_BI
    );
    escrowEntity.amountPaid = escrowEntity.amountPaid.plus(totalAmountPaid);
    escrowEntity.balance = escrowEntity.balance.minus(totalAmountPaid);
    escrowEntity.save();
  }

  if (event.params._isPartial) {
    const statusEventEntity = new PartialStatusEvent(toEventId(event));
    statusEventEntity.block = event.block.number;
    statusEventEntity.timestamp = event.block.timestamp;
    statusEventEntity.txHash = event.transaction.hash;
    statusEventEntity.escrowAddress = event.address;
    statusEventEntity.sender = event.transaction.from;
    statusEventEntity.save();
  } else {
    const statusEventEntity = new PaidStatusEvent(toEventId(event));
    statusEventEntity.block = event.block.number;
    statusEventEntity.timestamp = event.block.timestamp;
    statusEventEntity.txHash = event.transaction.hash;
    statusEventEntity.escrowAddress = event.address;
    statusEventEntity.sender = event.transaction.from;
    statusEventEntity.save();
  }

  // Update workers, and create payout entities
  for (let i = 0; i < event.params._recipients.length; i++) {
    const worker = createOrLoadWorker(event.params._recipients[i]);
    worker.totalAmountReceived = worker.totalAmountReceived.plus(
      event.params._amounts[i]
    );
    worker.payoutCount = worker.payoutCount.plus(ONE_BI);
    worker.save();

    const payoutId = `${event.transaction.hash.toHex()}-${event.params._recipients[
      i
    ].toHex()}-${i}`;
    const payment = new Payout(payoutId);
    payment.escrowAddress = event.address;
    payment.bulkPayoutTxId = event.params._txId;
    payment.recipient = event.params._recipients[i];
    payment.amount = event.params._amounts[i];
    payment.save();
  }
}

export function handleCancelled(event: Cancelled): void {
  // Create CancelledStatusEvent entity
  const eventEntity = new CancelledStatusEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.save();

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Cancelled';
    escrowEntity.save();
  }
}

export function handleCompleted(event: Completed): void {
  // Create CompletedStatusEvent entity
  const eventEntity = new CompletedStatusEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.save();

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Completed';
    escrowEntity.save();
  }
}
