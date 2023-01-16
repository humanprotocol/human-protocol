import {
  AllocationClosed,
  StakeAllocated,
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, Address, BigInt } from '@graphprotocol/graph-ts';

export function createStakeDepositedEvent(
  staker: string,
  tokens: i32,
  timestamp: BigInt
): StakeDeposited {
  const newStakeDepositedEvent = changetype<StakeDeposited>(newMockEvent());

  newStakeDepositedEvent.block.timestamp = timestamp;

  newStakeDepositedEvent.parameters = [];
  newStakeDepositedEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newStakeDepositedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );

  return newStakeDepositedEvent;
}

export function createStakeLockedEvent(
  staker: string,
  tokens: i32,
  until: i32,
  timestamp: BigInt
): StakeLocked {
  const newStakeLockedEvent = changetype<StakeLocked>(newMockEvent());

  newStakeLockedEvent.block.timestamp = timestamp;

  newStakeLockedEvent.parameters = [];
  newStakeLockedEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newStakeLockedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );
  newStakeLockedEvent.parameters.push(
    new ethereum.EventParam('until', ethereum.Value.fromI32(until))
  );

  return newStakeLockedEvent;
}

export function createStakeWithdrawnEvent(
  staker: string,
  tokens: i32,
  timestamp: BigInt
): StakeWithdrawn {
  const newStakeWithdrawnEvent = changetype<StakeWithdrawn>(newMockEvent());

  newStakeWithdrawnEvent.block.timestamp = timestamp;

  newStakeWithdrawnEvent.parameters = [];
  newStakeWithdrawnEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newStakeWithdrawnEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );

  return newStakeWithdrawnEvent;
}

export function createStakeSlashedEvent(
  staker: string,
  tokens: i32,
  escrowAddress: string,
  slasher: string,
  timestamp: BigInt
): StakeSlashed {
  const newStakeSlashedEvent = changetype<StakeSlashed>(newMockEvent());

  newStakeSlashedEvent.block.timestamp = timestamp;

  newStakeSlashedEvent.parameters = [];
  newStakeSlashedEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newStakeSlashedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );
  newStakeSlashedEvent.parameters.push(
    new ethereum.EventParam(
      'escrowAddress',
      ethereum.Value.fromAddress(Address.fromString(escrowAddress))
    )
  );
  newStakeSlashedEvent.parameters.push(
    new ethereum.EventParam(
      'slasher',
      ethereum.Value.fromAddress(Address.fromString(slasher))
    )
  );

  return newStakeSlashedEvent;
}

export function createStakeAllocatedEvent(
  staker: string,
  tokens: i32,
  escrowAddress: string,
  createdAt: i32,
  timestamp: BigInt
): StakeAllocated {
  const newStakeAllocatedEvent = changetype<StakeAllocated>(newMockEvent());

  newStakeAllocatedEvent.block.timestamp = timestamp;

  newStakeAllocatedEvent.parameters = [];
  newStakeAllocatedEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newStakeAllocatedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );
  newStakeAllocatedEvent.parameters.push(
    new ethereum.EventParam(
      'escrowAddress',
      ethereum.Value.fromAddress(Address.fromString(escrowAddress))
    )
  );
  newStakeAllocatedEvent.parameters.push(
    new ethereum.EventParam('createdAt', ethereum.Value.fromI32(createdAt))
  );

  return newStakeAllocatedEvent;
}

export function createAllocationClosedEvent(
  staker: string,
  tokens: i32,
  escrowAddress: string,
  closedAt: i32,
  timestamp: BigInt
): AllocationClosed {
  const newAllocationClosedEvent = changetype<AllocationClosed>(newMockEvent());

  newAllocationClosedEvent.block.timestamp = timestamp;

  newAllocationClosedEvent.parameters = [];
  newAllocationClosedEvent.parameters.push(
    new ethereum.EventParam(
      'staker',
      ethereum.Value.fromAddress(Address.fromString(staker))
    )
  );
  newAllocationClosedEvent.parameters.push(
    new ethereum.EventParam('tokens', ethereum.Value.fromI32(tokens))
  );
  newAllocationClosedEvent.parameters.push(
    new ethereum.EventParam(
      'escrowAddress',
      ethereum.Value.fromAddress(Address.fromString(escrowAddress))
    )
  );
  newAllocationClosedEvent.parameters.push(
    new ethereum.EventParam('closedAt', ethereum.Value.fromI32(closedAt))
  );

  return newAllocationClosedEvent;
}
