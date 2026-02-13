import {
  StakeDeposited,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import { createOrLoadOperator } from './KVStore';

export function handleStakeDeposited(event: StakeDeposited): void {
  const operator = createOrLoadOperator(event.params.staker);
  operator.stakedAmount = operator.stakedAmount.plus(event.params.tokens);
  operator.save();
}

export function handleStakeWithdrawn(event: StakeWithdrawn): void {
  const operator = createOrLoadOperator(event.params.staker);
  operator.stakedAmount = operator.stakedAmount.minus(event.params.tokens);
  operator.save();
}

export function handleStakeSlashed(event: StakeSlashed): void {
  const operator = createOrLoadOperator(event.params.staker);
  operator.stakedAmount = operator.stakedAmount.minus(event.params.tokens);
  operator.save();
}
