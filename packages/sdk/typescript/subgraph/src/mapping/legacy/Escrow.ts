import { dataSource } from '@graphprotocol/graph-ts';

import {
  BulkTransfer,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
} from '../../../generated/templates/LegacyEscrow/Escrow';
import {
  BulkPayoutEvent,
  Escrow,
  EscrowStatusEvent,
  SetupEvent,
  StoreResultsEvent,
} from '../../../generated/schema';
import { createOrLoadEscrowStatistics } from '../Escrow';
import { ONE_BI } from '../utils/number';
import { toEventId } from '../utils/event';
import { getEventDayData } from '../utils/dayUpdates';
import { createTransaction } from '../utils/transaction';

enum EscrowStatuses {
  Launched,
  Pending,
  Partial,
  Paid,
  Complete,
  Cancelled,
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

    const reputationOracle = escrowContract.try_reputationOracle();
    if (!reputationOracle.reverted) {
      escrowEntity.reputationOracle = reputationOracle.value;
    }
    const reputationOracleStake = escrowContract.try_reputationOracleStake();
    if (!reputationOracleStake.reverted) {
      escrowEntity.reputationOracleFee = reputationOracleStake.value;
    }

    const recordingOracle = escrowContract.try_recordingOracle();
    if (!recordingOracle.reverted) {
      escrowEntity.recordingOracle = recordingOracle.value;
    }
    const recordingOracleStake = escrowContract.try_recordingOracleStake();
    if (!recordingOracleStake.reverted) {
      escrowEntity.recordingOracleFee = recordingOracleStake.value;
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

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address().toHex());
  if (escrowEntity) {
    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const escrowStatus = escrowContract.try_status();

    if (!escrowStatus.reverted) {
      // Create EscrowStatusEvent entity
      const statusEventEntity = new EscrowStatusEvent(toEventId(event));
      statusEventEntity.block = event.block.number;
      statusEventEntity.timestamp = event.block.timestamp;
      statusEventEntity.txHash = event.transaction.hash;
      statusEventEntity.escrowAddress = event.address;
      statusEventEntity.sender = event.transaction.from;
      statusEventEntity.launcher = escrowEntity.launcher;
      if (escrowStatus.value == EscrowStatuses.Partial) {
        // Partially Paid Status
        escrowEntity.status = 'Partially Paid';
        statusEventEntity.status = 'Partial';

        statsEntity.partialStatusEventCount =
          statsEntity.partialStatusEventCount.plus(ONE_BI);
        statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

        eventDayData.dailyPartialStatusEventCount =
          eventDayData.dailyPartialStatusEventCount.plus(ONE_BI);
        eventDayData.dailyTotalEventCount =
          eventDayData.dailyTotalEventCount.plus(ONE_BI);
      } else if (escrowStatus.value == EscrowStatuses.Paid) {
        // Paid Status
        escrowEntity.status = 'Paid';
        statusEventEntity.status = 'Paid';

        statsEntity.paidStatusEventCount =
          statsEntity.paidStatusEventCount.plus(ONE_BI);
        statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

        eventDayData.dailyPaidStatusEventCount =
          eventDayData.dailyPaidStatusEventCount.plus(ONE_BI);
        eventDayData.dailyTotalEventCount =
          eventDayData.dailyTotalEventCount.plus(ONE_BI);
      }
      statusEventEntity.save();
    }

    const finalResultsUrl = escrowContract.try_finalResultsUrl();
    if (!finalResultsUrl.reverted) {
      escrowEntity.finalResultsUrl = finalResultsUrl.value;
    }
    escrowEntity.save();
  }

  // Save statistics, and event day data
  statsEntity.save();
  eventDayData.save();
}
