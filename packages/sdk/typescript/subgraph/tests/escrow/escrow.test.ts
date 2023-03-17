import { Address, BigInt, DataSourceContext } from '@graphprotocol/graph-ts';
import {
  afterAll,
  beforeAll,
  describe,
  test,
  assert,
  clearStore,
  dataSourceMock,
  beforeEach,
} from 'matchstick-as/assembly';

import { LaunchedEscrow } from '../../generated/schema';
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

const escrowAddressString = '0xA16081F360e3847006dB660bae1c6d1b2e17eC2A';
const escrowAddress = Address.fromString(escrowAddressString);
const workerAddressString = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const workerAddress = Address.fromString(workerAddressString);

describe('Escrow', () => {
  beforeAll(() => {
    dataSourceMock.setReturnValues(
      escrowAddressString,
      'rinkeby',
      new DataSourceContext()
    );

    const launchedEscrow = new LaunchedEscrow(escrowAddress.toHex());
    launchedEscrow.token = Address.zero();
    launchedEscrow.from = Address.zero();
    launchedEscrow.timestamp = BigInt.fromI32(0);
    launchedEscrow.amountAllocated = BigInt.fromI32(0);
    launchedEscrow.amountPayout = BigInt.fromI32(0);
    launchedEscrow.status = 'Launched';

    launchedEscrow.save();
  });

  afterAll(() => {
    dataSourceMock.resetValues();
  });

  test('should properly handle IntermediateStorage event', () => {
    const newIS = createISEvent(workerAddress, 'test.com', 'is_hash_1');
    handleIntermediateStorage(newIS);

    const id = `${newIS.transaction.hash.toHex()}-${newIS.logIndex.toString()}-${
      newIS.block.timestamp
    }`;

    assert.fieldEquals(
      'ISEvent',
      id,
      'timestamp',
      newIS.block.timestamp.toString()
    );
    assert.fieldEquals('ISEvent', id, 'sender', newIS.params._sender.toHex());
    assert.fieldEquals('ISEvent', id, '_url', newIS.params._url.toString());
    assert.fieldEquals('ISEvent', id, '_hash', newIS.params._hash.toString());
  });

  test('Should properly handle Pending event', () => {
    const newPending1 = createPendingEvent('test.com', 'is_hash_1');

    handlePending(newPending1);

    const id = `${newPending1.transaction.hash.toHex()}-${newPending1.logIndex.toString()}-${
      newPending1.block.timestamp
    }`;

    assert.fieldEquals(
      'PEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PEvent',
      id,
      '_url',
      newPending1.params.manifest.toString()
    );
    assert.fieldEquals(
      'PEvent',
      id,
      '_hash',
      newPending1.params.hash.toString()
    );

    // Escrow
    assert.fieldEquals(
      'LaunchedEscrow',
      escrowAddress.toHex(),
      'status',
      'Pending'
    );
  });

  test('Should properly handle BulkTransfer events', () => {
    const bulk1 = createBulkTransferEvent(
      1,
      [workerAddress, workerAddress],
      [1, 1],
      false,
      BigInt.fromI32(10)
    );
    const bulk2 = createBulkTransferEvent(
      3,
      [workerAddress, workerAddress, workerAddress, workerAddress],
      [1, 1, 1, 1],
      false,
      BigInt.fromI32(11)
    );

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
    assert.fieldEquals('BulkTransferEvent', id1, 'bulkCount', '2');
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

    // Payments Bulk 1
    const idP1 = `${bulk1.transaction.hash.toHex()}-${bulk1.params._recipients[0].toHex()}-${0}`;
    assert.fieldEquals(
      'Payment',
      idP1,
      'address',
      bulk1.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP1,
      'amount',
      bulk1.params._amounts[0].toString()
    );

    const idP2 = `${bulk1.transaction.hash.toHex()}-${bulk1.params._recipients[1].toHex()}-${1}`;
    assert.fieldEquals(
      'Payment',
      idP2,
      'address',
      bulk1.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP2,
      'amount',
      bulk1.params._amounts[0].toString()
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
    assert.fieldEquals('BulkTransferEvent', id2, 'bulkCount', '4');
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

    // Payments Bulk 2
    const idP3 = `${bulk2.transaction.hash.toHex()}-${bulk2.params._recipients[0].toHex()}-${0}`;
    assert.fieldEquals(
      'Payment',
      idP3,
      'address',
      bulk2.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP3,
      'amount',
      bulk2.params._amounts[0].toString()
    );

    const idP4 = `${bulk2.transaction.hash.toHex()}-${bulk2.params._recipients[1].toHex()}-${1}`;
    assert.fieldEquals(
      'Payment',
      idP4,
      'address',
      bulk2.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP4,
      'amount',
      bulk2.params._amounts[0].toString()
    );
    const idP5 = `${bulk2.transaction.hash.toHex()}-${bulk2.params._recipients[2].toHex()}-${2}`;
    assert.fieldEquals(
      'Payment',
      idP5,
      'address',
      bulk2.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP5,
      'amount',
      bulk2.params._amounts[0].toString()
    );

    const idP6 = `${bulk2.transaction.hash.toHex()}-${bulk2.params._recipients[3].toHex()}-${3}`;
    assert.fieldEquals(
      'Payment',
      idP6,
      'address',
      bulk2.params._recipients[0].toHex()
    );
    assert.fieldEquals(
      'Payment',
      idP6,
      'amount',
      bulk2.params._amounts[0].toString()
    );

    // Escrow
    assert.fieldEquals(
      'LaunchedEscrow',
      escrowAddress.toHex(),
      'status',
      'Paid'
    );
    assert.fieldEquals(
      'LaunchedEscrow',
      escrowAddress.toHex(),
      'amountPayout',
      '6'
    );

    // Worker
    assert.fieldEquals('Worker', workerAddress.toHex(), 'amountReceived', '6');
    assert.fieldEquals(
      'Worker',
      workerAddress.toHex(),
      'amountJobsSolvedPaid',
      '6'
    );
  });

  describe('Statistics', () => {
    beforeEach(() => {
      clearStore();
    });

    test('Should properly calculate IntermediateStorage event in statistics', () => {
      const newIS = createISEvent(workerAddress, 'test.com', 'is_hash_1');
      const newIS1 = createISEvent(workerAddress, 'test.com', 'is_hash_1');

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
    });

    test('Should properly calculate BulkTransfser event in statistics', () => {
      handleBulkTransfer(
        createBulkTransferEvent(
          1,
          [
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
          ],
          [1, 1, 1, 1, 1],
          false,
          BigInt.fromI32(11)
        )
      );
      handleBulkTransfer(
        createBulkTransferEvent(
          2,
          [workerAddress, workerAddress, workerAddress, workerAddress],
          [1, 1, 1, 1],
          false,
          BigInt.fromI32(11)
        )
      );

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
    });
  });
});
