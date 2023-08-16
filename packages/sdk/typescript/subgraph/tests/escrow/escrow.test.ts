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

import { Escrow } from '../../generated/schema';
import {
  STATISTICS_ENTITY_ID,
  handleIntermediateStorage,
  handlePending,
  handleBulkTransfer,
  handleCancelled,
  handleCompleted,
} from '../../src/mapping/Escrow';
import { ZERO_BI } from '../../src/mapping/utils/number';
import {
  createISEvent,
  createPendingEvent,
  createBulkTransferEvent,
  createCancelledEvent,
  createCompletedEvent,
} from './fixtures';

const escrowAddressString = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a';
const escrowAddress = Address.fromString(escrowAddressString);
const operatorAddressString = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const operatorAddress = Address.fromString(operatorAddressString);
const workerAddressString = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
const workerAddress = Address.fromString(workerAddressString);
const worker2AddressString = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';
const worker2Address = Address.fromString(worker2AddressString);

describe('Escrow', () => {
  beforeAll(() => {
    dataSourceMock.setReturnValues(
      escrowAddressString,
      'rinkeby',
      new DataSourceContext()
    );

    const escrow = new Escrow(escrowAddress.toHex());
    escrow.address = escrowAddress;
    escrow.token = Address.zero();
    escrow.factoryAddress = Address.zero();
    escrow.launcher = Address.zero();
    escrow.count = ZERO_BI;
    escrow.balance = BigInt.fromI32(100);
    escrow.totalFundedAmount = BigInt.fromI32(100);
    escrow.amountPaid = ZERO_BI;
    escrow.status = 'Launched';
    escrow.createdAt = BigInt.fromI32(0);

    escrow.save();
  });

  afterAll(() => {
    dataSourceMock.resetValues();
  });

  test('Should properly handle Pending event', () => {
    const URL = 'test.com';
    const HASH = 'is_hash_1';

    const newPending1 = createPendingEvent(operatorAddress, URL, HASH);

    handlePending(newPending1);

    const id = `${newPending1.transaction.hash.toHex()}-${newPending1.logIndex.toString()}-${
      newPending1.block.timestamp
    }`;

    // SetupEvent
    assert.fieldEquals(
      'SetupEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'SetupEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'SetupEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals('SetupEvent', id, 'escrowAddress', escrowAddressString);
    assert.fieldEquals('SetupEvent', id, 'sender', operatorAddressString);

    // PendingStatusEvent
    assert.fieldEquals(
      'PendingStatusEvent',
      id,
      'block',
      newPending1.block.number.toString()
    );
    assert.fieldEquals(
      'PendingStatusEvent',
      id,
      'timestamp',
      newPending1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PendingStatusEvent',
      id,
      'txHash',
      newPending1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PendingStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'PendingStatusEvent',
      id,
      'sender',
      operatorAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Pending');
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'manifestUrl', URL);
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'manifestHash', HASH);
  });

  test('should properly handle IntermediateStorage event', () => {
    const URL = 'test.com';
    const newIS = createISEvent(workerAddress, URL, 'is_hash_1');
    handleIntermediateStorage(newIS);

    const id = `${newIS.transaction.hash.toHex()}-${newIS.logIndex.toString()}-${
      newIS.block.timestamp
    }`;

    // StoreResultsEvent
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'block',
      newIS.block.number.toString()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'timestamp',
      newIS.block.timestamp.toString()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'txHash',
      newIS.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'StoreResultsEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('StoreResultsEvent', id, 'sender', workerAddressString);
    assert.fieldEquals('StoreResultsEvent', id, 'intermediateResultsUrl', URL);
  });

  test('Should properly handle BulkTransfer events', () => {
    // Bulk 1
    const bulk1 = createBulkTransferEvent(
      operatorAddress,
      1,
      [workerAddress, workerAddress],
      [1, 1],
      true,
      BigInt.fromI32(10)
    );

    handleBulkTransfer(bulk1);

    const id1 = `${bulk1.transaction.hash.toHex()}-${bulk1.logIndex.toString()}-${
      bulk1.block.timestamp
    }`;

    // BulkPayoutEvent
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id1, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkPayoutTxId', '1');
    assert.fieldEquals('BulkPayoutEvent', id1, 'bulkCount', '2');

    // PartialStatusEvent
    assert.fieldEquals(
      'PartialStatusEvent',
      id1,
      'block',
      bulk1.block.number.toString()
    );
    assert.fieldEquals(
      'PartialStatusEvent',
      id1,
      'timestamp',
      bulk1.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PartialStatusEvent',
      id1,
      'txHash',
      bulk1.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PartialStatusEvent',
      id1,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'PartialStatusEvent',
      id1,
      'sender',
      operatorAddressString
    );

    // Escrow
    assert.fieldEquals(
      'Escrow',
      escrowAddress.toHex(),
      'status',
      'Partially Paid'
    );

    // Bulk 2
    const bulk2 = createBulkTransferEvent(
      operatorAddress,
      3,
      [workerAddress, workerAddress, workerAddress, worker2Address],
      [1, 1, 1, 95],
      false,
      BigInt.fromI32(11)
    );

    handleBulkTransfer(bulk2);

    const id2 = `${bulk2.transaction.hash.toHex()}-${bulk2.logIndex.toString()}-${
      bulk2.block.timestamp
    }`;

    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'BulkPayoutEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('BulkPayoutEvent', id2, 'sender', operatorAddressString);
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkPayoutTxId', '3');
    assert.fieldEquals('BulkPayoutEvent', id2, 'bulkCount', '4');

    // PaidStatusEvent
    assert.fieldEquals(
      'PaidStatusEvent',
      id2,
      'block',
      bulk2.block.number.toString()
    );
    assert.fieldEquals(
      'PaidStatusEvent',
      id2,
      'timestamp',
      bulk2.block.timestamp.toString()
    );
    assert.fieldEquals(
      'PaidStatusEvent',
      id2,
      'txHash',
      bulk2.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'PaidStatusEvent',
      id2,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals('PaidStatusEvent', id2, 'sender', operatorAddressString);

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Paid');
  });

  test('Should properly handle Cancelled event', () => {
    const newCancelled = createCancelledEvent(operatorAddress);

    handleCancelled(newCancelled);

    const id = `${newCancelled.transaction.hash.toHex()}-${newCancelled.logIndex.toString()}-${
      newCancelled.block.timestamp
    }`;

    // CancelledStatusEvent
    assert.fieldEquals(
      'CancelledStatusEvent',
      id,
      'block',
      newCancelled.block.number.toString()
    );
    assert.fieldEquals(
      'CancelledStatusEvent',
      id,
      'timestamp',
      newCancelled.block.timestamp.toString()
    );
    assert.fieldEquals(
      'CancelledStatusEvent',
      id,
      'txHash',
      newCancelled.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'CancelledStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'CancelledStatusEvent',
      id,
      'sender',
      operatorAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Cancelled');
  });

  test('Should properly handle Completed event', () => {
    const newCompleted = createCompletedEvent(operatorAddress);

    handleCompleted(newCompleted);

    const id = `${newCompleted.transaction.hash.toHex()}-${newCompleted.logIndex.toString()}-${
      newCompleted.block.timestamp
    }`;

    // CompletedStatusEvent
    assert.fieldEquals(
      'CompletedStatusEvent',
      id,
      'block',
      newCompleted.block.number.toString()
    );
    assert.fieldEquals(
      'CompletedStatusEvent',
      id,
      'timestamp',
      newCompleted.block.timestamp.toString()
    );
    assert.fieldEquals(
      'CompletedStatusEvent',
      id,
      'txHash',
      newCompleted.transaction.hash.toHex()
    );
    assert.fieldEquals(
      'CompletedStatusEvent',
      id,
      'escrowAddress',
      escrowAddressString
    );
    assert.fieldEquals(
      'CompletedStatusEvent',
      id,
      'sender',
      operatorAddressString
    );

    // Escrow
    assert.fieldEquals('Escrow', escrowAddress.toHex(), 'status', 'Completed');
  });

  describe('Statistics', () => {
    beforeEach(() => {
      clearStore();
    });

    test('Should properly calculate setup & pending in statistics', () => {
      const newPending1 = createPendingEvent(
        operatorAddress,
        'test.com',
        'is_hash_1'
      );
      const newPending2 = createPendingEvent(
        operatorAddress,
        'test.com',
        'is_hash_1'
      );

      handlePending(newPending1);
      handlePending(newPending2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'setupEventCount',
        '2'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'pendingStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '4'
      );
    });

    test('Should properly calculate StoreResults event in statistics', () => {
      const newIS = createISEvent(workerAddress, 'test.com', 'is_hash_1');
      const newIS1 = createISEvent(workerAddress, 'test.com', 'is_hash_1');

      handleIntermediateStorage(newIS);
      handleIntermediateStorage(newIS1);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'storeResultsEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate bulkPayout, partialStatus, paidStatus event in statistics', () => {
      handleBulkTransfer(
        createBulkTransferEvent(
          operatorAddress,
          1,
          [
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
            workerAddress,
          ],
          [1, 1, 1, 1, 1],
          true,
          BigInt.fromI32(11)
        )
      );
      handleBulkTransfer(
        createBulkTransferEvent(
          operatorAddress,
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
        'bulkPayoutEventCount',
        '2'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'partialStatusEventCount',
        '1'
      );
      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'paidStatusEventCount',
        '1'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '4'
      );
    });

    test('Should properly calculate cancelled event in statstics', () => {
      const newCancelled1 = createCancelledEvent(operatorAddress);
      const newCancelled2 = createCancelledEvent(operatorAddress);

      handleCancelled(newCancelled1);
      handleCancelled(newCancelled2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'cancelledStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
        'completedStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '2'
      );
    });

    test('Should properly calculate completed event in statstics', () => {
      const newCompleted1 = createCompletedEvent(operatorAddress);
      const newCompleted2 = createCompletedEvent(operatorAddress);

      handleCompleted(newCompleted1);
      handleCompleted(newCompleted2);

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'completedStatusEventCount',
        '2'
      );

      [
        'fundEventCount',
        'setupEventCount',
        'storeResultsEventCount',
        'bulkPayoutEventCount',
        'pendingStatusEventCount',
        'cancelledStatusEventCount',
        'partialStatusEventCount',
        'paidStatusEventCount',
      ].forEach((field) => {
        assert.fieldEquals(
          'EscrowStatistics',
          STATISTICS_ENTITY_ID,
          field,
          '0'
        );
      });

      assert.fieldEquals(
        'EscrowStatistics',
        STATISTICS_ENTITY_ID,
        'totalEventCount',
        '2'
      );
    });
  });
});
