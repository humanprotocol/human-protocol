import { DataSavedEvent } from '../../generated/schema';
import { DataSaved } from '../../generated/KVStore/KVStore';
import { createOrLoadLeader } from './Staking';

export function handleDataSaved(event: DataSaved): void {
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}-${
    event.block.timestamp
  }`;

  const entity = new DataSavedEvent(id);

  entity.leader = event.params.sender;
  entity.key = event.params.key;
  entity.value = event.params.value;

  entity.block = event.block.number;
  entity.timestamp = event.block.timestamp;
  entity.transaction = event.transaction.hash;

  entity.save();

  // Update leader role, if necessary
  if (entity.key === 'role') {
    const leaderId = entity.leader.toHex();
    const leader = createOrLoadLeader(leaderId, entity.leader);

    leader.role = entity.value;
    leader.save();
  }
}
