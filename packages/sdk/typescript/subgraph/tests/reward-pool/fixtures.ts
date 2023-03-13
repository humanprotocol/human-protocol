import { RewardAdded } from '../../generated/RewardPool/RewardPool';
import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts';

export function createRewardAddedEvent(
  escrowAddress: string,
  slasher: string,
  tokens: i32,
  timestamp: BigInt
): RewardAdded {
  const newRewardAddedEvent = changetype<RewardAdded>(newMockEvent());

  newRewardAddedEvent.block.timestamp = timestamp;

  newRewardAddedEvent.parameters = [];
  newRewardAddedEvent.parameters.push(
    new ethereum.EventParam(
      'escrowAddress',
      ethereum.Value.fromAddress(Address.fromString(escrowAddress))
    )
  );
  newRewardAddedEvent.parameters.push(
    new ethereum.EventParam(
      'slasher',
      ethereum.Value.fromAddress(Address.fromString(slasher))
    )
  );
  newRewardAddedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );

  return newRewardAddedEvent;
}
