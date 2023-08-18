import { RewardAddedEvent } from '../../generated/schema';
import { RewardAdded } from '../../generated/RewardPool/RewardPool';
import { createOrLoadLeader } from './Staking';
import { toEventId } from './utils/event';

export function handleRewardAdded(event: RewardAdded): void {
  // Create RewardAddedEvent entity
  const eventEntity = new RewardAddedEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.escrowAddress = event.params.escrowAddress;
  eventEntity.staker = event.params.staker;
  eventEntity.slasher = event.params.slasher;
  eventEntity.amount = event.params.tokens;
  eventEntity.save();

  // Update leader
  const leader = createOrLoadLeader(event.params.slasher);
  leader.reward = leader.reward.plus(eventEntity.amount);
  leader.save();
}
