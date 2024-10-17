import { Address, BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as/assembly/index';
import {
  StakeDeposited,
  StakeLocked,
  StakeSlashed,
  StakeWithdrawn,
} from '../../generated/Staking/Staking';
import { generateUniqueHash } from '../../tests/utils';

export function createStakeDepositedEvent(
  staker: string,
  tokens: i32,
  timestamp: BigInt
): StakeDeposited {
  const newStakeDepositedEvent = changetype<StakeDeposited>(newMockEvent());
  newStakeDepositedEvent.transaction.hash = generateUniqueHash(
    staker,
    timestamp,
    newStakeDepositedEvent.transaction.nonce
  );
  newStakeDepositedEvent.block.timestamp = timestamp;
  newStakeDepositedEvent.transaction.from = Address.fromString(staker);
  newStakeDepositedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );

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
  newStakeLockedEvent.transaction.hash = generateUniqueHash(
    staker,
    timestamp,
    newStakeLockedEvent.transaction.nonce
  );
  newStakeLockedEvent.transaction.from = Address.fromString(staker);
  newStakeLockedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
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
  newStakeWithdrawnEvent.transaction.hash = generateUniqueHash(
    staker,
    timestamp,
    newStakeWithdrawnEvent.transaction.nonce
  );

  newStakeWithdrawnEvent.transaction.from = Address.fromString(staker);
  newStakeWithdrawnEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
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
  newStakeSlashedEvent.transaction.hash = generateUniqueHash(
    staker,
    timestamp,
    newStakeSlashedEvent.transaction.nonce
  );

  newStakeSlashedEvent.transaction.from = Address.fromString(staker);
  newStakeSlashedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
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
