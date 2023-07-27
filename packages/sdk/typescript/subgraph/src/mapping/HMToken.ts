import { Address, BigInt } from '@graphprotocol/graph-ts';

import {
  Approval,
  BulkApproval,
  BulkTransfer,
  Transfer,
} from '../../generated/HMToken/HMToken';
import {
  Escrow,
  FundEvent,
  HMTApprovalEvent,
  HMTBulkApprovalEvent,
  HMTBulkTransferEvent,
  HMTTransferEvent,
  HMTokenStatistics,
  Holder,
} from '../../generated/schema';
import { toEventId } from './utils/event';
import { ONE_BI, ZERO_BI } from './utils/number';
import { createOrLoadEscrowStatistics } from './Escrow';
import { getEventDayData } from './utils/dayUpdates';

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
    const eventDayData = getEventDayData(event);
    eventDayData.dailyFundEventCount =
      eventDayData.dailyFundEventCount.plus(ONE_BI);
    eventDayData.dailyTotalEventCount =
      eventDayData.dailyTotalEventCount.plus(ONE_BI);
    eventDayData.save();

    // Update escrow balance, and totalFundedAmount
    escrow.balance = escrow.balance.plus(event.params._value);
    escrow.totalFundedAmount = escrow.totalFundedAmount.plus(
      event.params._value
    );
    escrow.save();
  } else {
    // Update holders
    const diffHolders = updateHolders(
      event.params._from,
      event.params._value,
      false
    ).plus(updateHolders(event.params._to, event.params._value, true));
    statsEntity.holders = statsEntity.holders.plus(diffHolders);
  }

  statsEntity.save();
}

export function handleBulkTransfer(event: BulkTransfer): void {
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
