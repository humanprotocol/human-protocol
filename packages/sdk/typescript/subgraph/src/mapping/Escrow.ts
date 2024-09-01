import {
  BulkTransfer,
  BulkTransferV2,
  Cancelled,
  Completed,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
  Fund,
  PendingV2,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkPayoutEvent,
  Escrow,
  EscrowStatistics,
  EscrowStatusEvent,
  FundEvent,
  PendingEvent,
  StoreResultsEvent,
  Worker,
  Payout,
  DailyWorker,
} from '../../generated/schema';
import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  ethereum,
} from '@graphprotocol/graph-ts';
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

// Update statistics
function updateStatisticsForPending(): void {
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.pendingStatusEventCount =
    statsEntity.pendingStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );
  statsEntity.save();
}

// Update event day data
function updateEventDayDataForPending(event: ethereum.Event): void {
  const eventDayData = getEventDayData(event);
  eventDayData.dailyPendingStatusEventCount =
    eventDayData.dailyPendingStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount = eventDayData.dailyTotalEventCount.plus(
    ONE_BI.plus(ONE_BI)
  );
  eventDayData.save();
}

// Create common event entities
function createCommonEntitiesForPending(
  event: ethereum.Event,
  status: string
): EscrowStatusEvent {
  // Create pendingEvent entity
  const pendingEventEntity = new PendingEvent(toEventId(event));
  pendingEventEntity.block = event.block.number;
  pendingEventEntity.timestamp = event.block.timestamp;
  pendingEventEntity.txHash = event.transaction.hash;
  pendingEventEntity.escrowAddress = event.address;
  pendingEventEntity.sender = event.transaction.from;
  pendingEventEntity.save();

  // Create EscrowStatusEvent entity
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.status = status;
  statusEventEntity.save();

  return statusEventEntity;
}

// Update escrow entity
function updateEscrowEntityForPending(
  escrowEntity: Escrow,
  escrowStatusEvent: EscrowStatusEvent,
  manifestUrl: string,
  manifestHash: string,
  reputationOracle: Address | null = null,
  recordingOracle: Address | null = null,
  exchangeOracle: Address | null = null
): void {
  escrowEntity.manifestUrl = manifestUrl;
  escrowEntity.manifestHash = manifestHash;
  escrowEntity.status = 'Pending';

  // Update oracles if provided
  if (reputationOracle) {
    escrowEntity.reputationOracle = reputationOracle;
  }

  if (recordingOracle) {
    escrowEntity.recordingOracle = recordingOracle;
  }

  if (exchangeOracle) {
    escrowEntity.exchangeOracle = exchangeOracle;
  }

  escrowEntity.save();

  // Increase amount of jobs processed by leader
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
  escrowStatusEvent.launcher = escrowEntity.launcher;
  escrowStatusEvent.save();
}

export function handlePending(event: Pending): void {
  createTransaction(event, 'setup');

  // Create common entities for setup and status
  const escrowStatusEvent = createCommonEntitiesForPending(event, 'Pending');

  // Update statistics
  updateStatisticsForPending();

  // Update event day data
  updateEventDayDataForPending(event);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);

    const reputationOracle = escrowContract.try_reputationOracle();
    const recordingOracle = escrowContract.try_recordingOracle();
    const exchangeOracle = escrowContract.try_exchangeOracle();

    updateEscrowEntityForPending(
      escrowEntity,
      escrowStatusEvent,
      event.params.manifest,
      event.params.hash,
      !reputationOracle.reverted ? reputationOracle.value : null,
      !recordingOracle.reverted ? recordingOracle.value : null,
      !exchangeOracle.reverted ? exchangeOracle.value : null
    );
  }
}

export function handlePendingV2(event: PendingV2): void {
  createTransaction(event, 'setup');

  // Create common entities for setup and status
  const escrowStatusEvent = createCommonEntitiesForPending(event, 'Pending');

  // Update statistics
  updateStatisticsForPending();

  // Update event day data
  updateEventDayDataForPending(event);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    updateEscrowEntityForPending(
      escrowEntity,
      escrowStatusEvent,
      event.params.manifest,
      event.params.hash,
      event.params.reputationOracle,
      event.params.recordingOracle,
      event.params.exchangeOracle
    );
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

// Create BulkPayoutEvent entity
function createBulkPayoutEvent(
  event: ethereum.Event,
  txId: BigInt,
  recipientsLength: number
): void {
  const eventEntity = new BulkPayoutEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.bulkPayoutTxId = txId;
  eventEntity.bulkCount = BigInt.fromI32(<i32>recipientsLength);
  eventEntity.save();
}

// Update escrow statistics
function updateEscrowStatisticsForBulkTransfer(isPartial: boolean): void {
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.bulkPayoutEventCount =
    statsEntity.bulkPayoutEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);

  if (isPartial) {
    statsEntity.partialStatusEventCount =
      statsEntity.partialStatusEventCount.plus(ONE_BI);
  } else {
    statsEntity.paidStatusEventCount =
      statsEntity.paidStatusEventCount.plus(ONE_BI);
  }

  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();
}

// Update event day data
function updateEventDayDataForBulkTransfer(
  event: ethereum.Event,
  isPartial: boolean
): void {
  const eventDayData = getEventDayData(event);
  eventDayData.dailyBulkPayoutEventCount =
    eventDayData.dailyBulkPayoutEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);

  if (isPartial) {
    eventDayData.dailyPartialStatusEventCount =
      eventDayData.dailyPartialStatusEventCount.plus(ONE_BI);
  } else {
    eventDayData.dailyPaidStatusEventCount =
      eventDayData.dailyPaidStatusEventCount.plus(ONE_BI);
  }

  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();
}

// Create and save EscrowStatusEvent entity
function createAndSaveStatusEventForBulkTransfer(
  event: ethereum.Event,
  status: string,
  escrowEntity: Escrow | null
): void {
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.status = status;

  if (escrowEntity) {
    statusEventEntity.launcher = escrowEntity.launcher;
  }

  statusEventEntity.save();
}

// Update escrow entity
function updateEscrowEntityForBulkTransfer(
  escrowEntity: Escrow,
  isPartial: boolean,
  finalResultsUrl: string | null
): void {
  escrowEntity.status = isPartial ? 'Partial' : 'Paid';

  if (finalResultsUrl) {
    escrowEntity.finalResultsUrl = finalResultsUrl;
  }

  escrowEntity.save();
}

export function handleBulkTransfer(event: BulkTransfer): void {
  createTransaction(event, 'bulkTransfer');

  // Create BulkPayoutEvent entity
  createBulkPayoutEvent(
    event,
    event.params._txId,
    event.params._recipients.length
  );

  // Update escrow statistics
  updateEscrowStatisticsForBulkTransfer(event.params._isPartial);

  // Update event day data
  updateEventDayDataForBulkTransfer(event, event.params._isPartial);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const finalResultsUrl = escrowContract.try_finalResultsUrl();

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
        const eventDayData = getEventDayData(event);
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

        eventDayData.save();
      }
    }

    updateEscrowEntityForBulkTransfer(
      escrowEntity,
      event.params._isPartial,
      !finalResultsUrl.reverted ? finalResultsUrl.value : null
    );

    // Create and save EscrowStatusEvent entity
    createAndSaveStatusEventForBulkTransfer(
      event,
      escrowEntity.status,
      escrowEntity
    );
  }
}

export function handleBulkTransferV2(event: BulkTransferV2): void {
  createTransaction(event, 'bulkTransfer');

  // Create BulkPayoutEvent entity
  createBulkPayoutEvent(
    event,
    event.params._txId,
    event.params._recipients.length
  );

  // Update escrow statistics
  updateEscrowStatisticsForBulkTransfer(event.params._isPartial);

  // Update event day data
  updateEventDayDataForBulkTransfer(event, event.params._isPartial);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    // Assign finalResultsUrl directly from the event
    updateEscrowEntityForBulkTransfer(
      escrowEntity,
      event.params._isPartial,
      event.params.finalResultsUrl
    );

    // Create and save EscrowStatusEvent entity
    createAndSaveStatusEventForBulkTransfer(
      event,
      escrowEntity.status,
      escrowEntity
    );
  }
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
