import {
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import {
  StakeDepositedEvent,
  StakeLockedEvent,
  Staker,
  StakeSlashedEvent,
  StakeWithdrawnEvent,
} from '../../generated/schema';
import { Address } from '@graphprotocol/graph-ts';
import { ZERO_BI } from './utils/number';
import { toEventId } from './utils/event';

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

    staker.save();
  }

  return staker;
}

export function handleStakeDeposited(event: StakeDeposited): void {
  const eventEntity = new StakeDepositedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  const staker = createOrLoadStaker(event.params.staker);
  staker.stakedAmount = staker.stakedAmount.plus(eventEntity.amount);
  staker.lastDepositTimestamp = event.block.timestamp;
  staker.save();
}

export function handleStakeLocked(event: StakeLocked): void {
  const eventEntity = new StakeLockedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.lockedUntilTimestamp = event.params.until;
  eventEntity.save();

  const staker = createOrLoadStaker(event.params.staker);
  staker.lockedAmount = eventEntity.amount;
  staker.lockedUntilTimestamp = eventEntity.lockedUntilTimestamp;
  staker.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  const eventEntity = new StakeWithdrawnEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

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
  const eventEntity = new StakeSlashedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.staker = event.params.staker;
  eventEntity.amount = event.params.tokens;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.slashRequester = event.params.slashRequester;
  eventEntity.save();

  const staker = createOrLoadStaker(event.params.staker);
  staker.slashedAmount = staker.slashedAmount.plus(eventEntity.amount);
  staker.stakedAmount = staker.stakedAmount.minus(eventEntity.amount);
  staker.save();
}
