import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, BigInt, Address } from '@graphprotocol/graph-ts';

import { Launched } from '../../../generated/LegacyEscrowFactory/EscrowFactory';

export function createLaunchedEvent(
  factory: Address,
  launcher: Address,
  token: Address,
  escrow: Address,
  timestamp: BigInt
): Launched {
  const newLaunchedEvent = changetype<Launched>(newMockEvent());

  newLaunchedEvent.block.timestamp = timestamp;
  newLaunchedEvent.transaction.from = launcher;
  newLaunchedEvent.address = factory;

  newLaunchedEvent.parameters = [];

  const eip20Param = new ethereum.EventParam(
    'eip20',
    ethereum.Value.fromAddress(token)
  );
  const escrowParam = new ethereum.EventParam(
    'escrow',
    ethereum.Value.fromAddress(escrow)
  );

  newLaunchedEvent.parameters.push(eip20Param);
  newLaunchedEvent.parameters.push(escrowParam);

  return newLaunchedEvent;
}
