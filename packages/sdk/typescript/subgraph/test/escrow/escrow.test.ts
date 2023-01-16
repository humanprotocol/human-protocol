import { store, BigInt } from '@graphprotocol/graph-ts';
import { describe, test, assert, clearStore } from 'matchstick-as/assembly';

import { ISEvent } from '../../generated/schema';

import {
  handleIntermediateStorage,
  handlePending,
  handleBulkTransfer,
  STATISTICS_ENTITY_ID,
} from '../../src/mapping/Escrow';
import {
  createISEvent,
  createPendingEvent,
  createBulkTransferEvent,
} from './fixtures';

describe('Generic Entity case', () => {
  test('Should correctly get ISEvents entity details', () => {
    const DUMMY_ID = '0x0-0x0';

    const intermediateStorageEvent = new ISEvent(DUMMY_ID);
    intermediateStorageEvent.timestamp = BigInt.fromI32(10000);
    intermediateStorageEvent._url = 'test.com';
    intermediateStorageEvent.count = BigInt.fromI32(1);
    intermediateStorageEvent._hash = 'testhash';

    intermediateStorageEvent.save();

    assert.fieldEquals('ISEvent', DUMMY_ID, 'timestamp', '10000');
    assert.fieldEquals('ISEvent', DUMMY_ID, 'count', '1');
    assert.fieldEquals('ISEvent', DUMMY_ID, '_url', 'test.com');
    assert.fieldEquals('ISEvent', DUMMY_ID, '_hash', 'testhash');

    store.remove('ISEvent', DUMMY_ID);
  });
});

describe('EscrowStatistics entity', () => {
  test('Should properly calculate IntermediateStorage event in statistics', () => {
    const newIS = createISEvent('test.com', 'is_hash_1');
    const newIS1 = createISEvent('test.com', 'is_hash_1');

    handleIntermediateStorage(newIS);
    handleIntermediateStorage(newIS1);

    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'pendingEventCount',
      '0'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'intermediateStorageEventCount',
      '2'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'bulkTransferEventCount',
      '0'
    );

    clearStore();
  });

  test('Should properly calculate Pending event in statistics', () => {
    const newPending1 = createPendingEvent('test.com', 'is_hash_1');
    const newPending2 = createPendingEvent('test.com', 'is_hash_1');

    handlePending(newPending1);
    handlePending(newPending2);

    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'pendingEventCount',
      '2'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'intermediateStorageEventCount',
      '0'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'bulkTransferEventCount',
      '0'
    );

    clearStore();
  });

  test('Should properly calculate BulkTransfser event in statistics', () => {
    handleBulkTransfer(createBulkTransferEvent(1, 5, BigInt.fromI32(11)));
    handleBulkTransfer(createBulkTransferEvent(2, 4, BigInt.fromI32(11)));

    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'pendingEventCount',
      '0'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'intermediateStorageEventCount',
      '0'
    );
    assert.fieldEquals(
      'EscrowStatistics',
      STATISTICS_ENTITY_ID,
      'bulkTransferEventCount',
      '2'
    );

    clearStore();
  });
});

describe('Escrow entity', () => {
  test('Should properly index bulk transfers', () => {
    const bulk1 = createBulkTransferEvent(1, 2, BigInt.fromI32(10));
    const bulk2 = createBulkTransferEvent(3, 4, BigInt.fromI32(11));

    handleBulkTransfer(bulk1);
    handleBulkTransfer(bulk2);

    const id1 = `${bulk1.transaction.hash.toHex()}-${bulk1.logIndex.toString()}-${
      bulk1.block.timestamp
    }`;
    const id2 = `${bulk2.transaction.hash.toHex()}-${bulk2.logIndex.toString()}-${
      bulk2.block.timestamp
    }`;

    // Bulk 1
    assert.fieldEquals(
      'BulkTransferEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id1,
      'bulkCount',
      bulk1.params._bulkCount.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id1,
      'txId',
      bulk1.params._txId.toString()
    );

    assert.fieldEquals(
      'BulkTransferEvent',
      id1,
      'transaction',
      bulk1.transaction.hash.toHexString()
    );

    // Bulk 2
    assert.fieldEquals(
      'BulkTransferEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id2,
      'bulkCount',
      bulk2.params._bulkCount.toString()
    );
    assert.fieldEquals(
      'BulkTransferEvent',
      id2,
      'txId',
      bulk2.params._txId.toString()
    );

    assert.fieldEquals(
      'BulkTransferEvent',
      id2,
      'transaction',
      bulk2.transaction.hash.toHexString()
    );

    clearStore();
  });
});
