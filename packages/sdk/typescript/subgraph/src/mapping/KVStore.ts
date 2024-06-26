import {
  KVStore,
  KVStoreSetEvent,
  Leader,
  LeaderURL,
  ReputationNetwork,
} from '../../generated/schema';
import { DataSaved } from '../../generated/KVStore/KVStore';
import { createOrLoadLeader } from './Staking';
import { toEventId } from './utils/event';
import { isValidEthAddress } from './utils/ethAdrress';
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { createTransaction } from './utils/transaction';

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

export function createOrLoadReputationNetwork(
  address: Address
): ReputationNetwork {
  let reputationNetwork = ReputationNetwork.load(address.toHex());

  if (!reputationNetwork) {
    reputationNetwork = new ReputationNetwork(address.toHex());
    reputationNetwork.address = address;
    reputationNetwork.save();
  }

  return reputationNetwork;
}

export function createOrUpdateKVStore(event: DataSaved): void {
  const kvstoreId = `${event.params.sender.toHex()}-${event.params.key.toString()}`;
  let kvstore = KVStore.load(kvstoreId);

  if (!kvstore) {
    kvstore = new KVStore(kvstoreId);
    kvstore.address = event.params.sender;
    kvstore.key = event.params.key;
  }
  kvstore.block = event.block.number;
  kvstore.timestamp = event.block.timestamp;
  kvstore.value = event.params.value;

  kvstore.save();
}

export function handleDataSaved(event: DataSaved): void {
  createTransaction(event, 'set');
  // Create KVStoreSetEvent entity
  const eventEntity = new KVStoreSetEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.leaderAddress = event.params.sender;
  eventEntity.key = event.params.key;
  eventEntity.value = event.params.value;
  eventEntity.save();

  // Update KVStore entity
  createOrUpdateKVStore(event);

  // Update leader attribute, if necessary
  const leader = createOrLoadLeader(event.params.sender);

  const key = event.params.key.toLowerCase();
  if (key == 'role') {
    leader.role = event.params.value;
  } else if (key == 'fee') {
    leader.fee = BigInt.fromString(event.params.value);
  } else if (key == 'publickey' || key == 'public_key') {
    leader.publicKey = event.params.value;
  } else if (key == 'webhookurl' || key == 'webhook_url') {
    leader.webhookUrl = event.params.value;
  } else if (key == 'url') {
    leader.url = event.params.value;
  } else if (key == 'jobtypes' || key == 'job_types') {
    leader.jobTypes = event.params.value
      .split(',')
      .map<string>((type) => type.trim());
  } else if (
    isValidEthAddress(event.params.key) &&
    leader.role == 'Reputation Oracle'
  ) {
    const ethAddress = Address.fromString(event.params.key);

    const reputationNetwork = createOrLoadReputationNetwork(
      event.params.sender
    );

    const operator = createOrLoadLeader(ethAddress);

    if (event.params.value == 'ACTIVE') {
      operator.reputationNetwork = reputationNetwork.id;
    } else if (event.params.value == 'INACTIVE') {
      operator.reputationNetwork = '';
    }
    operator.save();
  }

  if (key.indexOf('url') > -1) {
    const leaderUrl = createOrLoadLeaderURL(leader, key);
    leaderUrl.url = event.params.value;
    leaderUrl.save();
  }

  leader.save();
}
