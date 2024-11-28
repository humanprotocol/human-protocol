import { DataSaved } from '../../generated/KVStore/KVStore';
import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, Address, BigInt, dataSource } from '@graphprotocol/graph-ts';
import { generateUniqueHash } from '../../tests/utils';

export function createDataSavedEvent(
  sender: string,
  key: string,
  value: string,
  timestamp: BigInt
): DataSaved {
  const newDataSavedEvent = changetype<DataSaved>(newMockEvent());
  newDataSavedEvent.transaction.hash = generateUniqueHash(
    sender.toString(),
    timestamp,
    newDataSavedEvent.transaction.nonce
  );

  newDataSavedEvent.transaction.value = BigInt.fromI32(0);
  newDataSavedEvent.block.timestamp = timestamp;
  newDataSavedEvent.transaction.to = Address.fromString(
    dataSource.address().toHexString()
  );

  newDataSavedEvent.parameters = [];
  newDataSavedEvent.parameters.push(
    new ethereum.EventParam(
      'sender',
      ethereum.Value.fromAddress(Address.fromString(sender))
    )
  );
  newDataSavedEvent.parameters.push(
    new ethereum.EventParam('key', ethereum.Value.fromString(key))
  );
  newDataSavedEvent.parameters.push(
    new ethereum.EventParam('value', ethereum.Value.fromString(value))
  );

  return newDataSavedEvent;
}
