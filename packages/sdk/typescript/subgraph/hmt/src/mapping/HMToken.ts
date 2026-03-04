import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import {
  Approval,
  BulkApproval,
  BulkTransfer,
  Transfer,
} from '../../generated/HMToken/HMToken';
import {
  HMTokenStatistics,
  Holder,
  UniqueReceiver,
  UniqueSender,
} from '../../generated/schema';
import { getEventDayData } from './utils/dayUpdates';
import { ONE_BI, ONE_DAY, ZERO_BI } from './utils/number';

export const HMT_STATISTICS_ENTITY_ID = Bytes.fromUTF8('hmt-statistics-id');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function constructStatsEntity(): HMTokenStatistics {
  const entity = new HMTokenStatistics(HMT_STATISTICS_ENTITY_ID);

  entity.totalTransferEventCount = ZERO_BI;
  entity.totalApprovalEventCount = ZERO_BI;
  entity.totalBulkApprovalEventCount = ZERO_BI;
  entity.totalBulkTransferEventCount = ZERO_BI;
  entity.totalValueTransfered = ZERO_BI;
  entity.holders = ZERO_BI;

  return entity;
}

function createOrLoadUniqueSender(
  dayStartTimestamp: BigInt,
  timestamp: BigInt,
  address: Address
): UniqueSender {
  const id = Bytes.fromI32(dayStartTimestamp.toI32()).concat(address);
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

function createOrLoadUniqueReceiver(
  dayStartTimestamp: BigInt,
  timestamp: BigInt,
  address: Address
): UniqueReceiver {
  const id = Bytes.fromI32(dayStartTimestamp.toI32()).concat(address);
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
  if (holderAddress.toHexString() == ZERO_ADDRESS) {
    return ZERO_BI;
  }

  let count = ZERO_BI;
  let holder = Holder.load(holderAddress);

  if (holder == null) {
    holder = new Holder(holderAddress);
    holder.address = holderAddress;
    holder.balance = ZERO_BI;
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

function createOrLoadHMTStatistics(): HMTokenStatistics {
  let statsEntity = HMTokenStatistics.load(HMT_STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  return statsEntity;
}

export function handleTransfer(event: Transfer): void {
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalTransferEventCount =
    statsEntity.totalTransferEventCount.plus(ONE_BI);
  statsEntity.totalValueTransfered = statsEntity.totalValueTransfered.plus(
    event.params._value
  );

  const diffHolders = updateHolders(
    event.params._from,
    event.params._value,
    false
  ).plus(updateHolders(event.params._to, event.params._value, true));
  statsEntity.holders = statsEntity.holders.plus(diffHolders);

  const eventDayData = getEventDayData(event);
  eventDayData.dailyHMTTransferCount =
    eventDayData.dailyHMTTransferCount.plus(ONE_BI);
  eventDayData.dailyHMTTransferAmount =
    eventDayData.dailyHMTTransferAmount.plus(event.params._value);

  const timestamp = event.block.timestamp.toI32();
  const dayID = timestamp / ONE_DAY;
  const dayStartTimestamp = BigInt.fromI32(dayID * ONE_DAY);

  if (event.params._from.toHexString() != ZERO_ADDRESS) {
    const uniqueSender = createOrLoadUniqueSender(
      dayStartTimestamp,
      event.block.timestamp,
      event.params._from
    );

    if (uniqueSender.transferCount.equals(ZERO_BI)) {
      eventDayData.dailyUniqueSenders =
        eventDayData.dailyUniqueSenders.plus(ONE_BI);
    }

    uniqueSender.transferCount = uniqueSender.transferCount.plus(
      event.params._value
    );
    uniqueSender.save();
  }

  if (event.params._to.toHexString() != ZERO_ADDRESS) {
    const uniqueReceiver = createOrLoadUniqueReceiver(
      dayStartTimestamp,
      event.block.timestamp,
      event.params._to
    );

    if (uniqueReceiver.receiveCount.equals(ZERO_BI)) {
      eventDayData.dailyUniqueReceivers =
        eventDayData.dailyUniqueReceivers.plus(ONE_BI);
    }

    uniqueReceiver.receiveCount = uniqueReceiver.receiveCount.plus(
      event.params._value
    );
    uniqueReceiver.save();
  }

  eventDayData.save();
  statsEntity.save();
}

export function handleBulkTransfer(event: BulkTransfer): void {
  void event;
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalBulkTransferEventCount =
    statsEntity.totalBulkTransferEventCount.plus(ONE_BI);
  statsEntity.save();
}

export function handleApproval(event: Approval): void {
  void event;
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalApprovalEventCount =
    statsEntity.totalApprovalEventCount.plus(ONE_BI);
  statsEntity.save();
}

export function handleBulkApproval(event: BulkApproval): void {
  void event;
  const statsEntity = createOrLoadHMTStatistics();
  statsEntity.totalBulkApprovalEventCount =
    statsEntity.totalBulkApprovalEventCount.plus(ONE_BI);
  statsEntity.save();
}
