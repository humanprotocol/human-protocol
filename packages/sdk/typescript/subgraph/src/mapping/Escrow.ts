import {
  BulkTransfer,
  Cancelled,
  Completed,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
  Fund,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkPayoutEvent,
  Escrow,
  EscrowStatistics,
  EscrowStatusEvent,
  FundEvent,
  SetupEvent,
  StoreResultsEvent,
  Worker,
  Payout,
  DailyWorker,
} from '../../generated/schema';
import { Address, BigInt, Bytes, dataSource } from '@graphprotocol/graph-ts';
import { ZERO_BI, ONE_BI } from './utils/number';
import { toEventDayId, toEventId } from './utils/event';
import { getEventDayData } from './utils/dayUpdates';
import { createTransaction } from './utils/transaction';
import { toBytes } from './utils/string';
import { createOrLoadLeader } from './Staking';

export const STATISTICS_ENTITY_ID = toBytes('escrow-statistics-id');

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
  let worker = Worker.load(address);

  if (!worker) {
    worker = new Worker(address);
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
  const escrowEntity = Escrow.load(dataSource.address());
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

    const recordingOracle = escrowContract.try_recordingOracle();
    if (!recordingOracle.reverted) {
      escrowEntity.recordingOracle = recordingOracle.value;
    }

    const exchangeOracle = escrowContract.try_exchangeOracle();
    if (!exchangeOracle.reverted) {
      escrowEntity.exchangeOracle = exchangeOracle.value;
    }

    escrowEntity.save();
    statusEventEntity.launcher = escrowEntity.launcher;
  }
  statusEventEntity.save();

  // Increase amount of jobs processed by leader
  if (escrowEntity) {
    if (escrowEntity.reputationOracle) {
      const reputationOracleLeader = createOrLoadLeader(
        Address.fromBytes(escrowEntity.reputationOracle!)
      );
      reputationOracleLeader.amountJobsProcessed =
        reputationOracleLeader.amountJobsProcessed.plus(ONE_BI);
      reputationOracleLeader.save();
    }

    if (escrowEntity.recordingOracle) {
      const recordingOracleLeader = createOrLoadLeader(
        Address.fromBytes(escrowEntity.recordingOracle!)
      );
      recordingOracleLeader.amountJobsProcessed =
        recordingOracleLeader.amountJobsProcessed.plus(ONE_BI);
      recordingOracleLeader.save();
    }

    if (escrowEntity.exchangeOracle) {
      const exchangeOracleLeader = createOrLoadLeader(
        Address.fromBytes(escrowEntity.exchangeOracle!)
      );
      exchangeOracleLeader.amountJobsProcessed =
        exchangeOracleLeader.amountJobsProcessed.plus(ONE_BI);
      exchangeOracleLeader.save();
    }
  }
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
  const escrowEntity = Escrow.load(dataSource.address());
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
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    escrowEntity.status = event.params._isPartial ? 'Partial' : 'Paid';

    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const finalResultsUrl = escrowContract.try_finalResultsUrl();
    if (!finalResultsUrl.reverted) {
      escrowEntity.finalResultsUrl = finalResultsUrl.value;
    }

    // If the escrow is non-HMT, track the balance data
    if (escrowEntity.isNonHMT) {
      for (let i = 0; i < event.params._recipients.length; i++) {
        const recipient = event.params._recipients[i];
        const amount = event.params._amounts[i];

        escrowEntity.amountPaid = escrowEntity.amountPaid.plus(amount);
        escrowEntity.balance = escrowEntity.balance.minus(amount);

        // Update worker, and create payout object
        const worker = createOrLoadWorker(recipient);
        worker.totalAmountReceived = worker.totalAmountReceived.plus(amount);
        worker.payoutCount = worker.payoutCount.plus(ONE_BI);
        worker.save();

        const payoutId = event.transaction.hash.concat(recipient);
        const payment = new Payout(payoutId);
        payment.escrowAddress = event.address;
        payment.recipient = recipient;
        payment.amount = amount;
        payment.createdAt = event.block.timestamp;
        payment.save();

        // Update event day data and daily worker
        eventDayData.dailyPayoutCount =
          eventDayData.dailyPayoutCount.plus(ONE_BI);
        eventDayData.dailyPayoutAmount =
          eventDayData.dailyPayoutAmount.plus(amount);

        const eventDayId = toEventDayId(event);
        const dailyWorkerId = Bytes.fromI32(eventDayId.toI32()).concat(
          recipient
        );

        let dailyWorker = DailyWorker.load(dailyWorkerId);
        if (!dailyWorker) {
          dailyWorker = new DailyWorker(dailyWorkerId);
          dailyWorker.timestamp = eventDayId;
          dailyWorker.address = recipient;
          dailyWorker.escrowAddress = event.address;
          dailyWorker.save();

          eventDayData.dailyWorkerCount =
            eventDayData.dailyWorkerCount.plus(ONE_BI);
        }
      }
      escrowEntity.save();
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
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    if (escrowEntity.isNonHMT) {
      // If escrow is funded with HMT, balance is already tracked by HMT transfer
      escrowEntity.balance = ZERO_BI;
    }
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
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    escrowEntity.status = 'Complete';
    escrowEntity.save();
    eventEntity.launcher = escrowEntity.launcher;
  }
  eventEntity.save();
}

export function handleFund(event: Fund): void {
  const escrowEntity = Escrow.load(dataSource.address());

  if (!escrowEntity) {
    return;
  }

  // If escrow is funded with HMT, balance is already tracked by HMT transfer
  if (escrowEntity.balance.gt(ZERO_BI)) {
    return;
  }

  createTransaction(event, 'fund', event.address, event.params._amount);

  // Create FundEvent entity
  const fundEventEntity = new FundEvent(toEventId(event));
  fundEventEntity.block = event.block.number;
  fundEventEntity.timestamp = event.block.timestamp;
  fundEventEntity.txHash = event.transaction.hash;
  fundEventEntity.escrowAddress = event.address;
  fundEventEntity.sender = event.transaction.from;
  fundEventEntity.amount = event.params._amount;
  fundEventEntity.save();

  // Update escrow statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.fundEventCount = statsEntity.fundEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day data
  const eventDayData = getEventDayData(event);
  eventDayData.dailyFundEventCount =
    eventDayData.dailyFundEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();

  // Update escrow entity
  escrowEntity.isNonHMT = true;
  escrowEntity.balance = escrowEntity.balance.plus(event.params._amount);
  escrowEntity.totalFundedAmount = escrowEntity.totalFundedAmount.plus(
    event.params._amount
  );

  escrowEntity.save();
}
