import {
  BulkTransfer,
  Cancelled,
  Completed,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
} from '../../generated/templates/Escrow/Escrow';
import { LegacyEscrow as LegacyEscrowContract } from '../../generated/templates/Escrow/LegacyEscrow';
import {
  BulkPayoutEvent,
  Escrow,
  EscrowStatistics,
  EscrowStatusEvent,
  SetupEvent,
  StoreResultsEvent,
  Worker,
} from '../../generated/schema';
import { Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { ZERO_BI, ONE_BI } from './utils/number';
import { toEventId } from './utils/event';
import { getEventDayData } from './utils/dayUpdates';
import { createTransaction } from './utils/transaction';

export const STATISTICS_ENTITY_ID = 'escrow-statistics-id';

function constructStatsEntity(): EscrowStatistics {
  const entity = new EscrowStatistics(STATISTICS_ENTITY_ID);

  entity.fundEventCount = ZERO_BI;
  entity.setupEventCount = ZERO_BI;
  entity.storeResultsEventCount = ZERO_BI;
  entity.bulkPayoutEventCount = ZERO_BI;
  entity.pendingStatusEventCount = ZERO_BI;
  entity.cancelledStatusEventCount = ZERO_BI;
  entity.partialStatusEventCount = ZERO_BI;
  entity.paidStatusEventCount = ZERO_BI;
  entity.completedStatusEventCount = ZERO_BI;
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
  createTransaction(event, 'setup');
  // Create SetupEvent entity
  const setupEventEntity = new SetupEvent(toEventId(event));
  setupEventEntity.block = event.block.number;
  setupEventEntity.timestamp = event.block.timestamp;
  setupEventEntity.txHash = event.transaction.hash;
  setupEventEntity.escrowAddress = event.address;
  setupEventEntity.sender = event.transaction.from;
  setupEventEntity.save();

  // Create EscrowStatusEvent entity
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.status = 'Pending';

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

    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const legacyEscrowContract = LegacyEscrowContract.bind(event.address);

    // Reputation & Recording Oracle Fee Variable is changed over time
    // For old one, it was oracleStake, for new one it is oracleFeePercentage

    const reputationOracle = escrowContract.try_reputationOracle();
    if (!reputationOracle.reverted) {
      escrowEntity.reputationOracle = reputationOracle.value;
    }
    const reputationOracleFeePercentage =
      escrowContract.try_reputationOracleFeePercentage();
    if (!reputationOracleFeePercentage.reverted) {
      escrowEntity.reputationOracleFee = BigInt.fromI32(
        reputationOracleFeePercentage.value
      );
    }
    const reputationOracleStake =
      legacyEscrowContract.try_reputationOracleStake();
    if (!reputationOracleStake.reverted) {
      escrowEntity.reputationOracleFee = reputationOracleStake.value;
    }

    const recordingOracle = escrowContract.try_recordingOracle();
    if (!recordingOracle.reverted) {
      escrowEntity.recordingOracle = recordingOracle.value;
    }
    const recordingOracleFeePercentage =
      escrowContract.try_recordingOracleFeePercentage();
    if (!recordingOracleFeePercentage.reverted) {
      escrowEntity.recordingOracleFee = BigInt.fromI32(
        recordingOracleFeePercentage.value
      );
    }
    const recordingOracleStake =
      legacyEscrowContract.try_recordingOracleStake();
    if (!recordingOracleStake.reverted) {
      escrowEntity.recordingOracleFee = recordingOracleStake.value;
    }

    const exchangeOracle = escrowContract.try_exchangeOracle();
    if (!exchangeOracle.reverted) {
      escrowEntity.exchangeOracle = exchangeOracle.value;
    }
    const exchangeOracleFeePercentage =
      escrowContract.try_exchangeOracleFeePercentage();
    if (!exchangeOracleFeePercentage.reverted) {
      escrowEntity.exchangeOracleFee = BigInt.fromI32(
        exchangeOracleFeePercentage.value
      );
    }

    escrowEntity.save();
    statusEventEntity.launcher = escrowEntity.launcher;
  }
  statusEventEntity.save();
}

export function handleIntermediateStorage(event: IntermediateStorage): void {
  createTransaction(event, 'storeResults');
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
  createTransaction(event, 'bulkTransfer');
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
  statsEntity.bulkPayoutEventCount =
    statsEntity.bulkPayoutEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyBulkPayoutEventCount =
    eventDayData.dailyBulkPayoutEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);

  // Create EscrowStatusEvent entity
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = event.params._isPartial ? 'Partial' : 'Paid';

    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const finalResultsUrl = escrowContract.try_finalResultsUrl();
    if (!finalResultsUrl.reverted) {
      escrowEntity.finalResultsUrl = finalResultsUrl.value;
    }

    escrowEntity.save();
    statusEventEntity.launcher = escrowEntity.launcher;
  }

  if (event.params._isPartial) {
    statusEventEntity.status = 'Partial';

    statsEntity.partialStatusEventCount =
      statsEntity.partialStatusEventCount.plus(ONE_BI);
    statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

    eventDayData.dailyPartialStatusEventCount =
      eventDayData.dailyPartialStatusEventCount.plus(ONE_BI);
    eventDayData.dailyTotalEventCount =
      eventDayData.dailyTotalEventCount.plus(ONE_BI);
  } else {
    statusEventEntity.status = 'Paid';

    statsEntity.paidStatusEventCount =
      statsEntity.paidStatusEventCount.plus(ONE_BI);
    statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

    eventDayData.dailyPaidStatusEventCount =
      eventDayData.dailyPaidStatusEventCount.plus(ONE_BI);
    eventDayData.dailyTotalEventCount =
      eventDayData.dailyTotalEventCount.plus(ONE_BI);
  }

  // Save statistics, and event day data
  statsEntity.save();
  eventDayData.save();
  statusEventEntity.save();
}

export function handleCancelled(event: Cancelled): void {
  createTransaction(event, 'cancel');
  // Create EscrowStatusEvent entity
  const eventEntity = new EscrowStatusEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.status = 'Cancelled';

  // Update statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.cancelledStatusEventCount =
    statsEntity.cancelledStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyCancelledStatusEventCount =
    eventDayData.dailyCancelledStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Cancelled';
    escrowEntity.save();
    eventEntity.launcher = escrowEntity.launcher;
  }
  eventEntity.save();
}

export function handleCompleted(event: Completed): void {
  createTransaction(event, 'complete');
  // Create EscrowStatusEvent entity
  const eventEntity = new EscrowStatusEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.status = 'Complete';

  // Update statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.completedStatusEventCount =
    statsEntity.completedStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyCompletedStatusEventCount =
    eventDayData.dailyCompletedStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    escrowEntity.status = 'Complete';
    escrowEntity.save();
    eventEntity.launcher = escrowEntity.launcher;
  }
  eventEntity.save();
}
