import { RewardAddedEvent } from '../../generated/schema';
import { RewardAdded } from '../../generated/RewardPool/RewardPool';
import { createOrLoadLeader } from './Staking';

export function handleRewardAdded(event: RewardAdded): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new RewardAddedEvent(id);

  // Entity fields can be set based on event parameters
  entity.escrow = event.params.escrowAddress;
  entity.staker = event.params.slasher;
  entity.amount = event.params.tokens;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  const leader = createOrLoadLeader(event.params.slasher);

  leader.reward = leader.reward.plus(entity.amount);
  leader.save();
}
