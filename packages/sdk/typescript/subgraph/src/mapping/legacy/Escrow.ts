import { dataSource } from '@graphprotocol/graph-ts';

import {
  BulkTransfer,
  IntermediateStorage,
  Pending,
} from '../../../generated/templates/LegacyEscrow/Escrow';
import {
  BulkPayoutEvent,
  Escrow,
  PaidStatusEvent,
  PendingStatusEvent,
  SetupEvent,
  StoreResultsEvent,
} from '../../../generated/schema';
import { createOrLoadEscrowStatistics } from '../Escrow';
import { ONE_BI } from '../utils/number';
import { toEventId } from '../utils/event';
import { getEventDayData } from '../utils/dayUpdates';

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
  statsEntity.setupEventCount = statsEntity.setupEventCount.plus(ONE_BI);
  statsEntity.pendingStatusEventCount =
    statsEntity.pendingStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailySetupEventCount =
    eventDayData.dailySetupEventCount.plus(ONE_BI);
  eventDayData.dailyPendingStatusEventCount =
    eventDayData.dailyPendingStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount = eventDayData.dailyTotalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );

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
  statsEntity.storeResultsEventCount =
    statsEntity.storeResultsEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyStoreResultsEventCount =
    eventDayData.dailyStoreResultsEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();

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
  eventEntity.bulkCount = event.params._bulkCount;
  eventEntity.save();

  // Update escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.bulkPayoutEventCount =
    statsEntity.bulkPayoutEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyBulkPayoutEventCount =
    eventDayData.dailyBulkPayoutEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);

  /**
   * @notice Legacy contract does not contain partial status in the event data.
   *         Simply consider the payout was the full payout.
   */

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Paid';
    escrowEntity.save();
  }

  const statusEventEntity = new PaidStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.save();

  statsEntity.paidStatusEventCount =
    statsEntity.paidStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

  eventDayData.dailyPaidStatusEventCount =
    eventDayData.dailyPaidStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);

  // Save statistics, and event day data
  statsEntity.save();
  eventDayData.save();
}
