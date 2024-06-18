import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';

import {
  Approval,
  BulkApproval,
  BulkTransfer,
  Transfer,
} from '../../generated/HMToken/HMToken';
import {
  DailyWorker,
  Escrow,
  FundEvent,
  HMTApprovalEvent,
  HMTBulkApprovalEvent,
  HMTBulkTransferEvent,
  HMTTransferEvent,
  HMTokenStatistics,
  Holder,
  Payout,
  UniqueReceiver,
  UniqueSender,
} from '../../generated/schema';
import { toEventDayId, toEventId } from './utils/event';
import { ONE_BI, ONE_DAY, ZERO_BI } from './utils/number';
import { createOrLoadEscrowStatistics, createOrLoadWorker } from './Escrow';
import { getEventDayData } from './utils/dayUpdates';
import { createTransaction } from './utils/transaction';

export const HMT_STATISTICS_ENTITY_ID = 'hmt-statistics-id';

function constructStatsEntity(): HMTokenStatistics {
  const entity = new HMTokenStatistics(HMT_STATISTICS_ENTITY_ID);

  entity.totalTransferEventCount = BigInt.fromI32(0);
  entity.totalApprovalEventCount = BigInt.fromI32(0);
  entity.totalBulkApprovalEventCount = BigInt.fromI32(0);
  entity.totalBulkTransferEventCount = BigInt.fromI32(0);
  entity.totalValueTransfered = BigInt.fromI32(0);
  entity.holders = BigInt.fromI32(0);

  return entity;
}

export function createOrLoadUniqueSender(
  dayStartTimestamp: string,
  timestamp: BigInt,
  address: Address
): UniqueSender {
  const id = `${dayStartTimestamp}-${address.toHex()}`;
  let uniqueSender = UniqueSender.load(id);

  if (!uniqueSender) {
    uniqueSender = new UniqueSender(id);
    uniqueSender.address = address;
    uniqueSender.transferCount = ZERO_BI;
    uniqueSender.timestamp = timestamp;
    uniqueSender.save();
  }

  return uniqueSender;
}

export function createOrLoadUniqueReceiver(
  dayStartTimestamp: string,
  timestamp: BigInt,
  address: Address
): UniqueReceiver {
  const id = `${dayStartTimestamp}-${address.toHex()}`;
  let uniqueReceiver = UniqueReceiver.load(id);

  if (!uniqueReceiver) {
    uniqueReceiver = new UniqueReceiver(id);
    uniqueReceiver.address = address;
    uniqueReceiver.receiveCount = ZERO_BI;
    uniqueReceiver.timestamp = timestamp;
    uniqueReceiver.save();
  }

  return uniqueReceiver;
}

function updateHolders(
  holderAddress: Address,
  value: BigInt,
  increase: boolean
): BigInt {
  if (
    holderAddress.toHexString() == '0x0000000000000000000000000000000000000000'
  )
    return ZERO_BI;
  let count = ZERO_BI;
  const id = holderAddress.toHex();
  let holder = Holder.load(id);

  if (holder == null) {
    holder = new Holder(id);
    holder.address = holderAddress;
    holder.balance = BigInt.fromI32(0);
  }
  const balanceBeforeTransfer = holder.balance;
  holder.balance = increase
    ? holder.balance.plus(value)
    : holder.balance.minus(value);

  if (balanceBeforeTransfer.isZero() && !holder.balance.isZero()) {
    count = ONE_BI;
  } else if (!balanceBeforeTransfer.isZero() && holder.balance.isZero()) {
    count = ONE_BI.neg();
  }

  holder.save();

  return count;
}

export function createOrLoadHMTStatistics(): HMTokenStatistics {
  let statsEntity = HMTokenStatistics.load(HMT_STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  return statsEntity;
}

export function handleTransfer(event: Transfer): void {
  // Create HMTTransferEvent entity
  const eventEntity = new HMTTransferEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.from = event.params._from;
  eventEntity.to = event.params._to;
  eventEntity.amount = event.params._value;
  eventEntity.save();

  // Update statistics
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalTransferEventCount =
    statsEntity.totalTransferEventCount.plus(ONE_BI);
  statsEntity.totalValueTransfered = statsEntity.totalValueTransfered.plus(
    event.params._value
  );

  const eventDayData = getEventDayData(event);
  const escrow = Escrow.load(event.params._to.toHex());
  if (escrow) {
    // Create FundEvent entity
    const fundEventEntity = new FundEvent(toEventId(event));
    fundEventEntity.block = event.block.number;
    fundEventEntity.timestamp = event.block.timestamp;
    fundEventEntity.txHash = event.transaction.hash;
    fundEventEntity.escrowAddress = escrow.address;
    fundEventEntity.sender = event.params._from;
    fundEventEntity.amount = event.params._value;
    fundEventEntity.save();

    // Update escrow statistics
    const statsEntity = createOrLoadEscrowStatistics();
    statsEntity.fundEventCount = statsEntity.fundEventCount.plus(ONE_BI);
    statsEntity.totalEventCount = statsEntity.totalEventCount.plus(ONE_BI);
    statsEntity.save();

    // Update event day data
    eventDayData.dailyFundEventCount =
      eventDayData.dailyFundEventCount.plus(ONE_BI);
    eventDayData.dailyTotalEventCount =
      eventDayData.dailyTotalEventCount.plus(ONE_BI);

    // Update escrow balance, and totalFundedAmount
    escrow.balance = escrow.balance.plus(event.params._value);
    escrow.totalFundedAmount = escrow.totalFundedAmount.plus(
      event.params._value
    );
    escrow.save();

    createTransaction(event, 'fund', event.params._to, event.params._value);
  } else {
    createTransaction(event, 'transfer', event.params._to, event.params._value);
  }

  // Update holders
  const diffHolders = updateHolders(
    event.params._from,
    event.params._value,
    false
  ).plus(updateHolders(event.params._to, event.params._value, true));
  statsEntity.holders = statsEntity.holders.plus(diffHolders);

  // Update event day data for HMT transfer
  eventDayData.dailyHMTTransferCount =
    eventDayData.dailyHMTTransferCount.plus(ONE_BI);
  eventDayData.dailyHMTTransferAmount =
    eventDayData.dailyHMTTransferAmount.plus(event.params._value);

  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = dayID * ONE_DAY;

  // Update unique sender
  const uniqueSender = createOrLoadUniqueSender(
    dayStartTimestamp.toString(),
    event.block.timestamp,
    event.params._from
  );
  if (uniqueSender.transferCount === ZERO_BI) {
    eventDayData.dailyUniqueSenders =
      eventDayData.dailyUniqueSenders.plus(ONE_BI);
  }
  uniqueSender.transferCount = uniqueSender.transferCount.plus(
    event.params._value
  );
  uniqueSender.save();

  // Update unique receiver
  const uniqueReceiver = createOrLoadUniqueReceiver(
    dayStartTimestamp.toString(),
    event.block.timestamp,
    event.params._to
  );
  if (uniqueReceiver.receiveCount === ZERO_BI) {
    eventDayData.dailyUniqueReceivers =
      eventDayData.dailyUniqueReceivers.plus(ONE_BI);
  }
  uniqueReceiver.receiveCount = uniqueReceiver.receiveCount.plus(
    event.params._value
  );
  uniqueReceiver.save();

  // Track HMT transfer from Escrow for paidAmount, balance, and payout items
  const fromEscrow = Escrow.load(event.params._from.toHex());
  if (fromEscrow) {
    fromEscrow.amountPaid = fromEscrow.amountPaid.plus(event.params._value);
    fromEscrow.balance = fromEscrow.balance.minus(event.params._value);
    fromEscrow.save();

    // Update worker, and create payout object
    const worker = createOrLoadWorker(event.params._to);
    worker.totalAmountReceived = worker.totalAmountReceived.plus(
      event.params._value
    );
    worker.payoutCount = worker.payoutCount.plus(ONE_BI);
    worker.save();

    const payoutId = `${event.transaction.hash.toHex()}-${event.params._to.toHex()}`;
    const payment = new Payout(payoutId);
    payment.escrowAddress = event.params._from;
    payment.recipient = event.params._to;
    payment.amount = event.params._value;
    payment.createdAt = event.block.timestamp;
    payment.save();

    // Update worker and payout day data
    eventDayData.dailyPayoutCount = eventDayData.dailyPayoutCount.plus(ONE_BI);
    eventDayData.dailyPayoutAmount = eventDayData.dailyPayoutAmount.plus(
      event.params._value
    );

    const eventDayId = toEventDayId(event);
    const dailyWorkerId = `${eventDayId}-${event.params._to.toHex()}`;
    let dailyWorker = DailyWorker.load(dailyWorkerId);
    if (!dailyWorker) {
      dailyWorker = new DailyWorker(dailyWorkerId);
      dailyWorker.timestamp = BigInt.fromString(eventDayId);
      dailyWorker.address = event.params._to;
      dailyWorker.escrowAddress = event.params._from;
      dailyWorker.save();

      eventDayData.dailyWorkerCount =
        eventDayData.dailyWorkerCount.plus(ONE_BI);
    }
  }

  eventDayData.save();
  statsEntity.save();
}

export function handleBulkTransfer(event: BulkTransfer): void {
  createTransaction(event, 'transferBulk');
  // Create HMTBulkTransferEvent entity
  const eventEntity = new HMTBulkTransferEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.txId = event.params._txId;
  eventEntity.bulkCount = event.params._bulkCount;
  eventEntity.save();

  // Update statistics
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalBulkTransferEventCount =
    statsEntity.totalBulkTransferEventCount.plus(ONE_BI);
  statsEntity.save();
}

export function handleApproval(event: Approval): void {
  createTransaction(
    event,
    'approve',
    event.params._spender,
    event.params._value
  );
  // Create HMTApprovalEvent entity
  const eventEntity = new HMTApprovalEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.owner = event.params._owner;
  eventEntity.spender = event.params._spender;
  eventEntity.amount = event.params._value;
  eventEntity.save();

  // Update statistics
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalApprovalEventCount =
    statsEntity.totalApprovalEventCount.plus(ONE_BI);
  statsEntity.save();
}

export function handleBulkApproval(event: BulkApproval): void {
  createTransaction(event, 'increaseApprovalBulk');
  // Create HMTBulkApprovalEvent entity
  const eventEntity = new HMTBulkApprovalEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.txId = event.params._txId;
  eventEntity.bulkCount = event.params._bulkCount;
  eventEntity.save();

  // Update statistics
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalBulkApprovalEventCount =
    statsEntity.totalBulkApprovalEventCount.plus(ONE_BI);
  statsEntity.save();
}
