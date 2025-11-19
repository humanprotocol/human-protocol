import {
  FeeWithdrawn,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import {
  Operator,
  StakeDepositedEvent,
  StakeLockedEvent,
  Staker,
  StakeSlashedEvent,
  StakeWithdrawnEvent,
} from '../../generated/schema';
import { Address, dataSource } from '@graphprotocol/graph-ts';
import { ZERO_BI } from './utils/number';
import { toEventId } from './utils/event';
import { createTransaction } from './utils/transaction';

export const TOKEN_ADDRESS = Address.fromString('{{ HMToken.address }}');

export function createOrLoadStaker(address: Address): Staker {
  let staker = Staker.load(address);

  if (!staker) {
    staker = new Staker(address);

    staker.address = address;
    staker.stakedAmount = ZERO_BI;
    staker.lockedAmount = ZERO_BI;
    staker.withdrawnAmount = ZERO_BI;
    staker.slashedAmount = ZERO_BI;
    staker.lockedUntilTimestamp = ZERO_BI;
    staker.lastDepositTimestamp = ZERO_BI;

    const operator = Operator.load(address);
    if (operator) {
      staker.operator = operator.id;
    }
    staker.save();
  }

  return staker;
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

  // Update staker
  const staker = createOrLoadStaker(event.params.staker);

  staker.stakedAmount = staker.stakedAmount.plus(eventEntity.amount);
  staker.lastDepositTimestamp = event.block.timestamp;

  staker.save();
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

  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.lockedAmount = eventEntity.amount;
  staker.lockedUntilTimestamp = eventEntity.lockedUntilTimestamp;
  staker.save();
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

  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.lockedAmount = staker.lockedAmount.minus(eventEntity.amount);
  if (staker.lockedAmount.equals(ZERO_BI)) {
    staker.lockedUntilTimestamp = ZERO_BI;
  }
  staker.stakedAmount = staker.stakedAmount.minus(eventEntity.amount);
  staker.withdrawnAmount = staker.withdrawnAmount.plus(eventEntity.amount);
  staker.save();
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

  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.slashedAmount = staker.slashedAmount.plus(eventEntity.amount);
  staker.stakedAmount = staker.stakedAmount.minus(eventEntity.amount);
  staker.save();
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
