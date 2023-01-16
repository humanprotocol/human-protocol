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
import { Address, BigInt } from '@graphprotocol/graph-ts';

export const STATISTICS_ENTITY_ID = 'leader-statistics-id';

export function constructStatsEntity(): LeaderStatistics {
  const entity = new LeaderStatistics(STATISTICS_ENTITY_ID);

  entity.leaders = BigInt.fromI32(0);

  return entity;
}

export function createOrLoadLeader(id: string, address: Address): Leader {
  let leader = Leader.load(id);

  if (!leader) {
    leader = new Leader(id);

    leader.address = address;
    leader.role = '';
    leader.amountStaked = BigInt.fromI32(0);
    leader.amountAllocated = BigInt.fromI32(0);
    leader.amountLocked = BigInt.fromI32(0);
    leader.lockedUntilTimestamp = BigInt.fromI32(0);
    leader.amountWithdrawn = BigInt.fromI32(0);
    leader.reputation = BigInt.fromI32(0);
    leader.amountJobsLaunched = BigInt.fromI32(0);
  }

  return leader;
}

export function handleStakeDeposited(event: StakeDeposited): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new StakeDepositedEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  // Increase leader count for new leader
  if (
    leader.amountStaked.toString() === '0' &&
    leader.amountLocked.toString() === '0' &&
    leader.amountWithdrawn.toString() === '0'
  ) {
    // Update Leader Statistics
    let statsEntity = LeaderStatistics.load(STATISTICS_ENTITY_ID);

    if (!statsEntity) {
      statsEntity = constructStatsEntity();
    }

    statsEntity.leaders = statsEntity.leaders.plus(BigInt.fromI32(1));

    statsEntity.save();
  }

  leader.amountStaked = leader.amountStaked.plus(entity.amount);

  leader.save();
}

export function handleStakeLocked(event: StakeLocked): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new StakeLockedEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;
  entity.lockedUntilTimestamp = event.params.until;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  leader.amountLocked = entity.amount;
  leader.lockedUntilTimestamp = entity.lockedUntilTimestamp;

  leader.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new StakeWithdrawnEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  leader.amountStaked = leader.amountStaked.minus(entity.amount);
  leader.amountWithdrawn = leader.amountWithdrawn.plus(entity.amount);

  leader.save();
}

export function handleStakeSlashed(event: StakeSlashed): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new StakeSlashedEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  leader.amountSlashed = leader.amountSlashed.plus(entity.amount);
  leader.amountAllocated = leader.amountAllocated.minus(entity.amount);
  leader.amountStaked = leader.amountStaked.minus(entity.amount);

  leader.save();
}

export function handleStakeAllocated(event: StakeAllocated): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new StakeAllocatedEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;
  entity.escrow = event.params.escrowAddress;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  leader.amountAllocated = leader.amountAllocated.plus(entity.amount);

  leader.save();
}

export function handleAllocationClosed(event: AllocationClosed): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new AllocationClosedEvent(id);

  // Entity fields can be set based on event parameters
  entity.staker = event.params.staker;
  entity.amount = event.params.tokens;
  entity.escrow = event.params.escrowAddress;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leaderId = event.params.staker.toHex();
  const leader = createOrLoadLeader(leaderId, event.params.staker);

  leader.amountAllocated = leader.amountAllocated.minus(entity.amount);

  leader.save();
}
