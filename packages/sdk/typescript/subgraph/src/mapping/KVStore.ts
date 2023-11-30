import { KVStoreSetEvent, Leader, LeaderURL } from '../../generated/schema';
import { DataSaved } from '../../generated/KVStore/KVStore';
import { createOrLoadLeader } from './Staking';
import { toEventId } from './utils/event';
import { BigInt } from '@graphprotocol/graph-ts';

export function createOrLoadLeaderURL(leader: Leader, key: string): LeaderURL {
  const entityId = `${leader.address.toHex()}-${key}`;
  let leaderUrl = LeaderURL.load(entityId);

  if (!leaderUrl) {
    leaderUrl = new LeaderURL(entityId);

    leaderUrl.key = key;
    leaderUrl.leader = leader.id;
  }

  return leaderUrl;
}

export function handleDataSaved(event: DataSaved): void {
  // Create KVStoreSetEvent entity
  const eventEntity = new KVStoreSetEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.leaderAddress = event.params.sender;
  eventEntity.key = event.params.key;
  eventEntity.value = event.params.value;
  eventEntity.save();

  // Update leader attribute, if necessary
  const leader = createOrLoadLeader(event.params.sender);

  const key = event.params.key.toLowerCase();
  if (key == 'role') {
    leader.role = event.params.value;
  } else if (key == 'fee') {
    leader.fee = BigInt.fromString(event.params.value);
  } else if (key == 'publickey') {
    leader.publicKey = event.params.value;
  } else if (key == 'webhookurl') {
    leader.webhookUrl = event.params.value;
  } else if (key == 'url') {
    leader.url = event.params.value;
  }

  if (key.indexOf('url') > -1) {
    const leaderUrl = createOrLoadLeaderURL(leader, key);
    leaderUrl.url = event.params.value;
    leaderUrl.save();
  }

  leader.save();
}
