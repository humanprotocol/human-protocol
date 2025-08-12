import {
  BulkTransfer,
  BulkTransferV2,
  BulkTransferV3,
  Cancelled,
  Completed,
  Escrow as EscrowContract,
  IntermediateStorage,
  Pending,
  Fund,
  PendingV2,
  Withdraw,
  CancellationRequested,
  CancellationRefund,
} from '../../generated/templates/Escrow/Escrow';
import {
  BulkPayoutEvent,
  CancellationRefundEvent,
  Escrow,
  EscrowStatistics,
  EscrowStatusEvent,
  FundEvent,
  PendingEvent,
  StoreResultsEvent,
  Worker,
  Payout,
  DailyWorker,
  InternalTransaction,
  WithdrawEvent,
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
import { createOrLoadOperator } from './Staking';

// eslint-disable-next-line prettier/prettier
export const HMT_ADDRESS = Address.fromString('{{ HMToken.address }}');
export const STATISTICS_ENTITY_ID = toBytes('escrow-statistics-id');

function constructStatsEntity(): EscrowStatistics {
  const entity = new EscrowStatistics(STATISTICS_ENTITY_ID);

  entity.fundEventCount = ZERO_BI;
  entity.storeResultsEventCount = ZERO_BI;
  entity.bulkPayoutEventCount = ZERO_BI;
  entity.pendingStatusEventCount = ZERO_BI;
  entity.toCancelStatusEventCount = ZERO_BI;
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
    worker.totalHMTAmountReceived = ZERO_BI;
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

  // Increase amount of jobs processed by operator
  if (escrowEntity.reputationOracle) {
    const reputationOracleOperator = createOrLoadOperator(
      Address.fromBytes(escrowEntity.reputationOracle!)
    );
    reputationOracleOperator.amountJobsProcessed =
      reputationOracleOperator.amountJobsProcessed.plus(ONE_BI);
    reputationOracleOperator.save();
  }

  if (escrowEntity.recordingOracle) {
    const recordingOracleOperator = createOrLoadOperator(
      Address.fromBytes(escrowEntity.recordingOracle!)
    );
    recordingOracleOperator.amountJobsProcessed =
      recordingOracleOperator.amountJobsProcessed.plus(ONE_BI);
    recordingOracleOperator.save();
  }

  if (escrowEntity.exchangeOracle) {
    const exchangeOracleOperator = createOrLoadOperator(
      Address.fromBytes(escrowEntity.exchangeOracle!)
    );
    exchangeOracleOperator.amountJobsProcessed =
      exchangeOracleOperator.amountJobsProcessed.plus(ONE_BI);
    exchangeOracleOperator.save();
  }
  escrowStatusEvent.launcher = escrowEntity.launcher;
  escrowStatusEvent.save();
}

export function handlePending(event: Pending): void {
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

export function handlePendingV2(event: PendingV2): void {
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
  // Create StoreResultsEvent entity
  const eventEntity = new StoreResultsEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.intermediateResultsUrl = event.params.url;
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
    escrowEntity.intermediateResultsUrl = event.params.url;
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

// Create BulkPayoutEvent entity
function createBulkPayoutEvent(
  event: ethereum.Event,
  payoutId: string,
  recipientsLength: number
): void {
  const eventEntity = new BulkPayoutEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.address;
  eventEntity.sender = event.transaction.from;
  eventEntity.payoutId = payoutId;
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
  // Create BulkPayoutEvent entity
  createBulkPayoutEvent(
    event,
    event.params.txId.toString(),
    event.params.recipients.length
  );

  // Update escrow statistics
  updateEscrowStatisticsForBulkTransfer(event.params.isPartial);

  // Update event day data
  updateEventDayDataForBulkTransfer(event, event.params.isPartial);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    // Read data on-chain
    const escrowContract = EscrowContract.bind(event.address);
    const finalResultsUrl = escrowContract.try_finalResultsUrl();

    updateEscrowEntityForBulkTransfer(
      escrowEntity,
      event.params.isPartial,
      !finalResultsUrl.reverted ? finalResultsUrl.value : null
    );

    // Create and save EscrowStatusEvent entity
    createAndSaveStatusEventForBulkTransfer(
      event,
      escrowEntity.status,
      escrowEntity
    );

    createTransaction(
      event,
      'bulkTransfer',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
  }
}

function handleBulkTransferCommon(
  event: ethereum.Event,
  payoutId: string,
  recipients: Address[],
  amounts: BigInt[],
  isPartial: boolean,
  finalResultsUrl: string
): void {
  // Create BulkPayoutEvent entity
  createBulkPayoutEvent(event, payoutId, recipients.length);

  // Update escrow statistics
  updateEscrowStatisticsForBulkTransfer(isPartial);

  // Update event day data
  updateEventDayDataForBulkTransfer(event, isPartial);

  // Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    const transaction = createTransaction(
      event,
      'bulkTransfer',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.token)
    );

    // If the escrow is non-HMT, track the balance data
    if (Address.fromBytes(escrowEntity.token) != HMT_ADDRESS) {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const amount = amounts[i];

        escrowEntity.amountPaid = escrowEntity.amountPaid.plus(amount);
        escrowEntity.balance = escrowEntity.balance.minus(amount);

        // Update worker, and create payout object
        const worker = createOrLoadWorker(recipient);
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

        const internalTransaction = new InternalTransaction(
          event.transaction.hash
            .concatI32(i)
            .concatI32(event.block.timestamp.toI32())
        );
        internalTransaction.from = Address.fromBytes(escrowEntity.address);
        internalTransaction.to = recipient;
        internalTransaction.value = amount;
        internalTransaction.transaction = transaction.id;
        internalTransaction.method = 'transfer';
        internalTransaction.escrow = Address.fromBytes(escrowEntity.address);
        internalTransaction.save();

        eventDayData.save();
      }
    }

    // Assign finalResultsUrl directly from the event
    updateEscrowEntityForBulkTransfer(escrowEntity, isPartial, finalResultsUrl);

    // Create and save EscrowStatusEvent entity
    createAndSaveStatusEventForBulkTransfer(
      event,
      escrowEntity.status,
      escrowEntity
    );
  }
}

export function handleBulkTransferV2(event: BulkTransferV2): void {
  handleBulkTransferCommon(
    event,
    event.params.txId.toString(),
    event.params.recipients,
    event.params.amounts,
    event.params.isPartial,
    event.params.finalResultsUrl
  );
}

export function handleBulkTransferV3(event: BulkTransferV3): void {
  handleBulkTransferCommon(
    event,
    event.params.payoutId.toHex(),
    event.params.recipients,
    event.params.amounts,
    event.params.isPartial,
    event.params.finalResultsUrl
  );
}

export function handleCancelled(event: Cancelled): void {
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
    createTransaction(
      event,
      'cancelled',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
    escrowEntity.status = 'Cancelled';
    escrowEntity.save();
    eventEntity.launcher = escrowEntity.launcher;
  }
  eventEntity.save();
}

export function handleCompleted(event: Completed): void {
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
    const transaction = createTransaction(
      event,
      'complete',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
    if (
      escrowEntity.balance &&
      escrowEntity.balance.gt(ZERO_BI) &&
      escrowEntity.token != HMT_ADDRESS
    ) {
      const internalTransaction = new InternalTransaction(toEventId(event));
      internalTransaction.from = escrowEntity.address;
      internalTransaction.to = escrowEntity.launcher;
      internalTransaction.value = escrowEntity.balance;
      internalTransaction.transaction = transaction.id;
      internalTransaction.method = 'transfer';
      internalTransaction.escrow = escrowEntity.address;
      internalTransaction.token = escrowEntity.token;
      internalTransaction.save();

      escrowEntity.balance = ZERO_BI;
    }
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

  // Create FundEvent entity
  const fundEventEntity = new FundEvent(toEventId(event));
  fundEventEntity.block = event.block.number;
  fundEventEntity.timestamp = event.block.timestamp;
  fundEventEntity.txHash = event.transaction.hash;
  fundEventEntity.escrowAddress = event.address;
  fundEventEntity.sender = event.transaction.from;
  fundEventEntity.amount = event.params.amount;
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
  escrowEntity.totalFundedAmount = event.params.amount;

  if (escrowEntity.token != HMT_ADDRESS) {
    escrowEntity.balance = event.params.amount;
  }

  escrowEntity.save();
}

export function handleWithdraw(event: Withdraw): void {
  const escrowEntity = Escrow.load(dataSource.address());

  if (!escrowEntity) {
    return;
  }

  createTransaction(
    event,
    'withdraw',
    event.transaction.from,
    Address.fromBytes(escrowEntity.address),
    event.transaction.from,
    Address.fromBytes(escrowEntity.address),
    event.params.amount,
    event.params.token
  );

  // Create WithdrawEvent entity
  const withdrawEventEntity = new WithdrawEvent(toEventId(event));
  withdrawEventEntity.block = event.block.number;
  withdrawEventEntity.timestamp = event.block.timestamp;
  withdrawEventEntity.txHash = event.transaction.hash;
  withdrawEventEntity.escrowAddress = event.address;
  withdrawEventEntity.sender = event.transaction.from;
  withdrawEventEntity.receiver = escrowEntity.canceler;
  withdrawEventEntity.amount = event.params.amount;
  withdrawEventEntity.token = event.params.token;
  withdrawEventEntity.save();
}

export function handleCancellationRequested(
  event: CancellationRequested
): void {
  // Create EscrowStatus entity
  const statusEventEntity = new EscrowStatusEvent(toEventId(event));
  statusEventEntity.block = event.block.number;
  statusEventEntity.timestamp = event.block.timestamp;
  statusEventEntity.txHash = event.transaction.hash;
  statusEventEntity.escrowAddress = event.address;
  statusEventEntity.sender = event.transaction.from;
  statusEventEntity.status = 'ToCancel';
  statusEventEntity.save();

  // Update global statistics
  const statsEntity = createOrLoadEscrowStatistics();
  statsEntity.toCancelStatusEventCount =
    statsEntity.toCancelStatusEventCount.plus(ONE_BI);
  statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
  statsEntity.save();

  // Update event day statistics
  const eventDayData = getEventDayData(event);
  eventDayData.dailyToCancelStatusEventCount =
    eventDayData.dailyToCancelStatusEventCount.plus(ONE_BI);
  eventDayData.dailyTotalEventCount =
    eventDayData.dailyTotalEventCount.plus(ONE_BI);
  eventDayData.save();

  //Update escrow entity
  const escrowEntity = Escrow.load(dataSource.address());
  if (escrowEntity) {
    createTransaction(
      event,
      'cancel',
      event.transaction.from,
      Address.fromBytes(escrowEntity.address),
      null,
      Address.fromBytes(escrowEntity.address)
    );
    escrowEntity.status = 'ToCancel';
    escrowEntity.save();
    statusEventEntity.launcher = escrowEntity.launcher;
    statusEventEntity.save();
  }
}

export function handleCancellationRefund(event: CancellationRefund): void {
  const escrowEntity = Escrow.load(dataSource.address());
  if (!escrowEntity) return;

  const transaction = createTransaction(
    event,
    'cancellationRefund',
    event.transaction.from,
    Address.fromBytes(escrowEntity.address),
    Address.fromBytes(escrowEntity.launcher),
    Address.fromBytes(escrowEntity.address),
    event.params.amount,
    Address.fromBytes(escrowEntity.token)
  );
  if (Address.fromBytes(escrowEntity.token) != HMT_ADDRESS) {
    // If escrow is funded with HMT, balance is already tracked by HMT transfer
    const internalTransaction = new InternalTransaction(toEventId(event));
    internalTransaction.from = escrowEntity.address;
    internalTransaction.to = Address.fromBytes(escrowEntity.token);
    internalTransaction.receiver = escrowEntity.canceler;
    internalTransaction.value = escrowEntity.balance;
    internalTransaction.transaction = transaction.id;
    internalTransaction.method = 'transfer';
    internalTransaction.token = Address.fromBytes(escrowEntity.token);
    internalTransaction.save();
    escrowEntity.balance = ZERO_BI;
  }

  const entity = new CancellationRefundEvent(toEventId(event));
  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.txHash = event.transaction.hash;
  entity.escrowAddress = event.address;
  entity.receiver = escrowEntity.launcher;
  entity.amount = event.params.amount;
  entity.save();
}
