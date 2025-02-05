import {
  FeeWithdrawn,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import {
  Operator,
  OperatorStatistics,
  StakeDepositedEvent,
  StakeLockedEvent,
  StakeSlashedEvent,
  StakeWithdrawnEvent,
} from '../../generated/schema';
import { Address, dataSource } from '@graphprotocol/graph-ts';
import { ONE_BI, ZERO_BI } from './utils/number';
import { toEventId } from './utils/event';
import { createTransaction } from './utils/transaction';
import { toBytes } from './utils/string';

export const STATISTICS_ENTITY_ID = toBytes('operator-statistics-id');
export const TOKEN_ADDRESS = Address.fromString('{{ HMToken.address }}');

function constructStatsEntity(): OperatorStatistics {
  const entity = new OperatorStatistics(STATISTICS_ENTITY_ID);

  entity.operators = ZERO_BI;

  return entity;
}

export function createOrLoadOperatorStatistics(): OperatorStatistics {
  let statsEntity = OperatorStatistics.load(STATISTICS_ENTITY_ID);

  if (!statsEntity) {
    statsEntity = constructStatsEntity();
  }

  return statsEntity;
}

export function createOrLoadOperator(address: Address): Operator {
  let operator = Operator.load(address);

  if (!operator) {
    operator = new Operator(address);

    operator.address = address;
    operator.amountStaked = ZERO_BI;
    operator.amountLocked = ZERO_BI;
    operator.lockedUntilTimestamp = ZERO_BI;
    operator.amountSlashed = ZERO_BI;
    operator.amountWithdrawn = ZERO_BI;
    operator.reward = ZERO_BI;
    operator.amountJobsProcessed = ZERO_BI;
  }

  return operator;
}

export function handleStakeDeposited(event: StakeDeposited): void {
  createTransaction(
    event,
    'stake',
    event.params.staker,
    dataSource.address(),
    null,
    null,
    event.params.tokens,
    TOKEN_ADDRESS
  );
  // Create StakeDepostiedEvent entity
  const eventEntity = new StakeDepositedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  // Update operator
  const operator = createOrLoadOperator(event.params.staker);

  // Increase operator count for new operator
  if (
    operator.amountStaked.equals(ZERO_BI) &&
    operator.amountLocked.equals(ZERO_BI) &&
    operator.amountWithdrawn.equals(ZERO_BI)
  ) {
    // Update Operator Statistics
    const statsEntity = createOrLoadOperatorStatistics();
    statsEntity.operators = statsEntity.operators.plus(ONE_BI);
    statsEntity.save();
  }

  operator.amountStaked = operator.amountStaked.plus(eventEntity.amount);
  operator.save();
}

export function handleStakeLocked(event: StakeLocked): void {
  createTransaction(
    event,
    'unstake',
    event.params.staker,
    dataSource.address(),
    null,
    null,
    event.params.tokens,
    TOKEN_ADDRESS
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

  // Update operator
  const operator = createOrLoadOperator(event.params.staker);
  operator.amountLocked = eventEntity.amount;
  operator.lockedUntilTimestamp = eventEntity.lockedUntilTimestamp;
  operator.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  createTransaction(
    event,
    'stakeWithdrawn',
    event.params.staker,
    dataSource.address(),
    null,
    null,
    event.params.tokens,
    TOKEN_ADDRESS
  );
  // Create StakeWithdrawnEvent entity
  const eventEntity = new StakeWithdrawnEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  // Update operator
  const operator = createOrLoadOperator(event.params.staker);
  operator.amountLocked = operator.amountLocked.minus(eventEntity.amount);
  if (operator.amountLocked.equals(ZERO_BI)) {
    operator.lockedUntilTimestamp = ZERO_BI;
  }
  operator.amountStaked = operator.amountStaked.minus(eventEntity.amount);
  operator.amountWithdrawn = operator.amountWithdrawn.plus(eventEntity.amount);
  operator.save();
}

export function handleStakeSlashed(event: StakeSlashed): void {
  createTransaction(
    event,
    'slash',
    event.params.staker,
    dataSource.address(),
    null,
    event.params.escrowAddress,
    event.params.tokens,
    TOKEN_ADDRESS
  );
  // Create StakeSlashedEvent entity
  const eventEntity = new StakeSlashedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.slashRequester = event.params.slashRequester;
  eventEntity.save();

  // Update operator
  const operator = createOrLoadOperator(event.params.staker);
  operator.amountSlashed = operator.amountSlashed.plus(eventEntity.amount);
  operator.amountStaked = operator.amountStaked.minus(eventEntity.amount);
  operator.save();
}

export function handleFeeWithdrawn(event: FeeWithdrawn): void {
  createTransaction(
    event,
    'withdrawFees',
    event.transaction.from,
    dataSource.address(),
    null,
    null,
    event.params.amount,
    TOKEN_ADDRESS
  );
}
