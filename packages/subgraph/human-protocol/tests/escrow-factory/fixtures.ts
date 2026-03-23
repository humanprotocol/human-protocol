import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt, Address, dataSource } from '@graphprotocol/graph-ts';

import {
  Launched,
  LaunchedV2,
} from '../../generated/EscrowFactory/EscrowFactory';
import { generateUniqueHash } from '../../tests/utils';

export function createLaunchedEvent(
  factory: Address,
  launcher: Address,
  token: Address,
  escrow: Address,
  timestamp: BigInt
): Launched {
  const newLaunchedEvent = changetype<Launched>(newMockEvent());
  newLaunchedEvent.transaction.hash = generateUniqueHash(
    escrow.toString(),
    timestamp,
    newLaunchedEvent.transaction.nonce
  );

  newLaunchedEvent.block.timestamp = timestamp;
  newLaunchedEvent.transaction.from = launcher;
  newLaunchedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
  newLaunchedEvent.address = factory;

  newLaunchedEvent.parameters = [];

  const tokenParam = new ethereum.EventParam(
    'token',
    ethereum.Value.fromAddress(token)
  );
  const escrowParam = new ethereum.EventParam(
    'escrow',
    ethereum.Value.fromAddress(escrow)
  );

  newLaunchedEvent.parameters.push(tokenParam);
  newLaunchedEvent.parameters.push(escrowParam);

  return newLaunchedEvent;
}

export function createLaunchedV2Event(
  factory: Address,
  launcher: Address,
  token: Address,
  escrow: Address,
  jobRequesterId: string,
  timestamp: BigInt
): LaunchedV2 {
  const newLaunchedEvent = changetype<LaunchedV2>(newMockEvent());
  newLaunchedEvent.transaction.hash = generateUniqueHash(
    escrow.toString(),
    timestamp,
    newLaunchedEvent.transaction.nonce
  );

  newLaunchedEvent.block.timestamp = timestamp;
  newLaunchedEvent.transaction.from = launcher;
  newLaunchedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );
  newLaunchedEvent.address = factory;

  newLaunchedEvent.parameters = [];

  const tokenParam = new ethereum.EventParam(
    'token',
    ethereum.Value.fromAddress(token)
  );
  const escrowParam = new ethereum.EventParam(
    'escrow',
    ethereum.Value.fromAddress(escrow)
  );
  const jobRequesterIdParam = new ethereum.EventParam(
    'jobRequesterId',
    ethereum.Value.fromString(jobRequesterId)
  );

  newLaunchedEvent.parameters.push(tokenParam);
  newLaunchedEvent.parameters.push(escrowParam);
  newLaunchedEvent.parameters.push(jobRequesterIdParam);

  return newLaunchedEvent;
}
