import {
  AllocationClosed,
  StakeAllocated,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import {
  AllocationClosedEvent,
  Leader,
  LeaderStatistics,
  StakeAllocatedEvent,
  StakeDepositedEvent,
  StakeLockedEvent,
  StakeSlashedEvent,
  StakeWithdrawnEvent,
} from '../../generated/schema';
import { Address } from '@graphprotocol/graph-ts';
import { ONE_BI, ZERO_BI } from './utils/number';
import { toEventId } from './utils/event';
import { createTransaction } from './utils/transaction';

export const STATISTICS_ENTITY_ID = 'leader-statistics-id';

function constructStatsEntity(): LeaderStatistics {
  const entity = new LeaderStatistics(STATISTICS_ENTITY_ID);

  entity.leaders = ZERO_BI;

  return entity;
}

export function createOrLoadLeaderStatistics(): LeaderStatistics {
  let statsEntity = LeaderStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  return statsEntity;
}

export function createOrLoadLeader(address: Address): Leader {
  let leader = Leader.load(address.toHex());

  if (!leader) {
    leader = new Leader(address.toHex());

    leader.address = address;
    leader.amountStaked = ZERO_BI;
    leader.amountAllocated = ZERO_BI;
    leader.amountLocked = ZERO_BI;
    leader.lockedUntilTimestamp = ZERO_BI;
    leader.amountSlashed = ZERO_BI;
    leader.amountWithdrawn = ZERO_BI;
    leader.reward = ZERO_BI;
    leader.reputation = ZERO_BI;
    leader.amountJobsLaunched = ZERO_BI;
  }

  return leader;
}

export function handleStakeDeposited(event: StakeDeposited): void {
  createTransaction(event, 'stake', event.transaction.to, event.params.tokens);
  // Create StakeDepostiedEvent entity
  const eventEntity = new StakeDepositedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);

  // Increase leader count for new leader
  if (
    leader.amountStaked.equals(ZERO_BI) &&
    leader.amountLocked.equals(ZERO_BI) &&
    leader.amountWithdrawn.equals(ZERO_BI)
  ) {
    // Update Leader Statistics
    const statsEntity = createOrLoadLeaderStatistics();
    statsEntity.leaders = statsEntity.leaders.plus(ONE_BI);
    statsEntity.save();
  }

  leader.amountStaked = leader.amountStaked.plus(eventEntity.amount);
  leader.save();
}

export function handleStakeLocked(event: StakeLocked): void {
  createTransaction(
    event,
    'unstake',
    event.transaction.to,
    event.params.tokens
  );
  // Create StakeLockedEvent entity
  const eventEntity = new StakeLockedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.lockedUntilTimestamp = event.params.until;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);
  leader.amountLocked = eventEntity.amount;
  leader.lockedUntilTimestamp = eventEntity.lockedUntilTimestamp;
  leader.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  createTransaction(
    event,
    'withdraw',
    event.transaction.to,
    event.params.tokens
  );
  // Create StakeWithdrawnEvent entity
  const eventEntity = new StakeWithdrawnEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);
  leader.amountLocked = leader.amountLocked.minus(eventEntity.amount);
  if (leader.amountLocked.equals(ZERO_BI)) {
    leader.lockedUntilTimestamp = ZERO_BI;
  }
  leader.amountStaked = leader.amountStaked.minus(eventEntity.amount);
  leader.amountWithdrawn = leader.amountWithdrawn.plus(eventEntity.amount);
  leader.save();
}

export function handleStakeAllocated(event: StakeAllocated): void {
  createTransaction(
    event,
    'allocate',
    event.params.escrowAddress,
    event.params.tokens
  );
  // Create StakeAllocatedEvent entity
  const eventEntity = new StakeAllocatedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);
  leader.amountAllocated = leader.amountAllocated.plus(eventEntity.amount);
  leader.save();
}

export function handleAllocationClosed(event: AllocationClosed): void {
  createTransaction(
    event,
    'closeAllocation',
    event.params.escrowAddress,
    event.params.tokens
  );
  // Create AllocationClosedEvent entity
  const eventEntity = new AllocationClosedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);
  leader.amountAllocated = leader.amountAllocated.minus(eventEntity.amount);
  leader.save();
}

export function handleStakeSlashed(event: StakeSlashed): void {
  createTransaction(event, 'slash', event.params.slasher, event.params.tokens);
  // Create StakeSlashedEvent entity
  const eventEntity = new StakeSlashedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.slasher = event.params.slasher;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.staker);
  leader.amountSlashed = leader.amountSlashed.plus(eventEntity.amount);
  leader.amountAllocated = leader.amountAllocated.minus(eventEntity.amount);
  leader.amountStaked = leader.amountStaked.minus(eventEntity.amount);
  leader.save();
}
