import {
  FeeWithdrawn,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import { Operator, Staker } from '../../generated/schema';
import { Address, dataSource } from '@graphprotocol/graph-ts';
import { ZERO_BI } from './utils/number';
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
  // Update staker
  const staker = createOrLoadStaker(event.params.staker);

  staker.stakedAmount = staker.stakedAmount.plus(event.params.tokens);
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
  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.lockedAmount = event.params.tokens;
  staker.lockedUntilTimestamp = event.params.until;
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
  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.lockedAmount = staker.lockedAmount.minus(event.params.tokens);
  if (staker.lockedAmount.equals(ZERO_BI)) {
    staker.lockedUntilTimestamp = ZERO_BI;
  }
  staker.stakedAmount = staker.stakedAmount.minus(event.params.tokens);
  staker.withdrawnAmount = staker.withdrawnAmount.plus(event.params.tokens);
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
  // Update staker
  const staker = createOrLoadStaker(event.params.staker);
  staker.slashedAmount = staker.slashedAmount.plus(event.params.tokens);
  staker.stakedAmount = staker.stakedAmount.minus(event.params.tokens);
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
