import { Address, dataSource } from '@graphprotocol/graph-ts';

import {
  BulkTransfer,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
} from '../../../generated/templates/LegacyEscrow/Escrow';
import { Escrow } from '../../../generated/schema';
import { createOrLoadEscrowStatistics } from '../Escrow';
import { ONE_BI } from '../utils/number';
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
  // Updates escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.pendingStatusEventCount =
    statsEntity.pendingStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyPendingStatusEventCount =
    eventDayData.dailyPendingStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount = eventDayData.dailyTotalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    escrowEntity.manifest = event.params.manifest;
    escrowEntity.manifestHash = event.params.hash;
    escrowEntity.status = 'Pending';

    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);

    const reputationOracle = escrowContract.try_reputationOracle();
    if (!reputationOracle.reverted) {
      escrowEntity.reputationOracle = reputationOracle.value;
    }

    const recordingOracle = escrowContract.try_recordingOracle();
    if (!recordingOracle.reverted) {
      escrowEntity.recordingOracle = recordingOracle.value;
    }

    escrowEntity.save();

    createTransaction(
      event,
      'setup',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
  }
}

export function handleIntermediateStorage(event: IntermediateStorage): void {
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
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    escrowEntity.intermediateResultsUrl = event.params._url;
    escrowEntity.intermediateResultsHash = event.params._hash;
    escrowEntity.save();

    createTransaction(
      event,
      'storeResults',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
  }
}

export function handleBulkTransfer(event: BulkTransfer): void {
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
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const escrowStatus = escrowContract.try_status();

    if (!escrowStatus.reverted) {
      // Create EscrowStatusEvent entity
      if (escrowStatus.value == EscrowStatuses.Partial) {
        // Partially Paid Status
        escrowEntity.status = 'Partially Paid';

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

        statsEntity.paidStatusEventCount =
          statsEntity.paidStatusEventCount.plus(ONE_BI);
        statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

        eventDayData.dailyPaidStatusEventCount =
          eventDayData.dailyPaidStatusEventCount.plus(ONE_BI);
        eventDayData.dailyTotalEventCount =
          eventDayData.dailyTotalEventCount.plus(ONE_BI);
      }
    }

    const finalResultsUrl = escrowContract.try_finalResultsUrl();
    if (!finalResultsUrl.reverted) {
      escrowEntity.finalResultsUrl = finalResultsUrl.value;
    }
    escrowEntity.save();

    createTransaction(
      event,
      'bulkTransfer',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
  }

  // Save statistics, and event day data
  statsEntity.save();
  eventDayData.save();
}
