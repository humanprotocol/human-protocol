import { DataSaved } from '../../generated/KVStore/KVStore';
import { newMockEvent } from 'matchstick-as/assembly/index';
import { ethereum, Address } from '@graphprotocol/graph-ts';

export function createDataSavedEvent(
  sender: string,
  key: string,
  value: string
): DataSaved {
  const newDataSavedEvent = changetype<DataSaved>(newMockEvent());
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
