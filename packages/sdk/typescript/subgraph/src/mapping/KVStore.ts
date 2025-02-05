import {
  Address,
  BigInt,
  Bytes,
  dataSource,
  log,
  Value,
} from '@graphprotocol/graph-ts';
import { DataSaved } from '../../generated/KVStore/KVStore';
import {
  KVStore,
  KVStoreSetEvent,
  Operator,
  OperatorURL,
  ReputationNetwork,
} from '../../generated/schema';
import { createOrLoadOperator } from './Staking';
import { isValidEthAddress } from './utils/ethAdrress';
import { toEventId } from './utils/event';
import { toBytes } from './utils/string';
import { createTransaction } from './utils/transaction';
import { store } from '@graphprotocol/graph-ts';

export function createOrLoadOperatorURL(
  operator: Operator,
  key: string
): OperatorURL {
  const entityId = operator.address.concat(toBytes(key));
  let operatorUrl = OperatorURL.load(entityId);

  if (!operatorUrl) {
    operatorUrl = new OperatorURL(entityId);

    operatorUrl.key = key;
    operatorUrl.operator = operator.id;
  }

  return operatorUrl;
}

export function createOrLoadReputationNetwork(
  address: Address
): ReputationNetwork {
  let reputationNetwork = ReputationNetwork.load(address);

  if (!reputationNetwork) {
    reputationNetwork = new ReputationNetwork(address);
    reputationNetwork.address = address;
    reputationNetwork.save();
  }

  return reputationNetwork;
}

export function createOrUpdateKVStore(event: DataSaved): void {
  const kvstoreId = event.params.sender.concat(toBytes(event.params.key));
  let kvstore = KVStore.load(kvstoreId);

  if (event.params.value == '' && kvstore) {
    store.remove('KVStore', kvstoreId.toHexString());
    return;
  }

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
  // Log the event details
  log.info('DataSaved event received:', []);
  log.info('Sender: {}', [event.params.sender.toHexString()]);
  log.info('Key: {}', [event.params.key]);
  log.info('Value: {}', [event.params.value]);

  createTransaction(event, 'set', event.transaction.from, dataSource.address());
  // Create KVStoreSetEvent entity
  const eventEntity = new KVStoreSetEvent(toEventId(event));
  eventEntity.block = event.block.number;
  eventEntity.timestamp = event.block.timestamp;
  eventEntity.txHash = event.transaction.hash;
  eventEntity.operatorAddress = event.params.sender;
  eventEntity.key = event.params.key;
  eventEntity.value = event.params.value;
  eventEntity.save();

  // Update KVStore entity
  createOrUpdateKVStore(event);

  // Update operator attribute, if necessary
  const operator = createOrLoadOperator(event.params.sender);

  const key = event.params.key.toLowerCase();
  if (event.params.value == '') {
    operator.set(key, Value.fromNull());
  } else {
    if (key == 'role') {
      operator.role = event.params.value;
    } else if (key == 'fee') {
      operator.fee = BigInt.fromString(event.params.value);
    } else if (key == 'publickey' || key == 'public_key') {
      operator.publicKey = event.params.value;
    } else if (key == 'webhookurl' || key == 'webhook_url') {
      operator.webhookUrl = event.params.value;
    } else if (key == 'website') {
      operator.website = event.params.value;
    } else if (key == 'url') {
      operator.url = event.params.value;
    } else if (key == 'jobtypes' || key == 'job_types') {
      operator.jobTypes = event.params.value
        .split(',')
        .map<string>((type) => type.trim());
    } else if (
      isValidEthAddress(event.params.key) &&
      operator.role == 'Reputation Oracle'
    ) {
      const ethAddress = Address.fromString(event.params.key);

      const reputationNetwork = createOrLoadReputationNetwork(
        event.params.sender
      );

      const operator = createOrLoadOperator(ethAddress);

      let reputationNetworks = operator.reputationNetworks;
      if (reputationNetworks === null) {
        reputationNetworks = [];
      }

      if (event.params.value.toLowerCase() == 'active') {
        reputationNetworks.push(reputationNetwork.id);
      } else if (event.params.value.toLowerCase() == 'inactive') {
        const filteredNetworks: Bytes[] = [];
        for (let i = 0; i < reputationNetworks.length; i++) {
          if (reputationNetworks[i] != reputationNetwork.id) {
            filteredNetworks.push(reputationNetworks[i]);
          }
        }
        reputationNetworks = filteredNetworks;
      }

      operator.reputationNetworks = reputationNetworks;

      operator.save();
    } else if (key == 'registration_needed') {
      operator.registrationNeeded = event.params.value.toLowerCase() == 'true';
    } else if (key == 'registration_instructions') {
      operator.registrationInstructions = event.params.value;
    } else if (key == 'name') {
      operator.name = event.params.value;
    } else if (key == 'category') {
      operator.category = event.params.value;
    }
  }

  if (key.indexOf('url') > -1) {
    const operatorUrl = createOrLoadOperatorURL(operator, key);
    operatorUrl.url = event.params.value;
    operatorUrl.save();
  }

  operator.save();
}
